import { readFileSync } from "fs";
import { readFile } from "fs/promises";
import assert from "node:assert";
import { createServer as createHttpServer, createServer } from "node:http";
import os from "node:os";
import { URL } from "node:url";
import path from "path";

import { useEffect, useRef, useState } from "react";
import { createHttpTerminator } from "http-terminator";
import open, { apps as openApps } from "open";
import { SourceMapConsumer } from "source-map";
import WebSocket, { WebSocketServer } from "ws";

import { version } from "../package.json";

import type Protocol from "devtools-protocol";
import type { IncomingMessage, Server, ServerResponse } from "node:http";
import type { MessageEvent } from "ws";

const logger = console;

/**
 * A helper function that waits for a port to be available.
 */
export async function waitForPortToBeAvailable(
  port: number,
  options: { retryPeriod: number; timeout: number; abortSignal: AbortSignal }
): Promise<void> {
  return new Promise((resolve, reject) => {
    options.abortSignal.addEventListener("abort", () => {
      const abortError = new Error("waitForPortToBeAvailable() aborted");
      (abortError as Error & { code: string }).code = "ABORT_ERR";
      doReject(abortError);
    });

    const timeout = setTimeout(() => {
      doReject(new Error(`Timed out waiting for port ${port}`));
    }, options.timeout);

    const interval = setInterval(checkPort, options.retryPeriod);
    checkPort();

    function doResolve() {
      clearTimeout(timeout);
      clearInterval(interval);
      resolve();
    }

    function doReject(err: unknown) {
      clearInterval(interval);
      clearTimeout(timeout);
      reject(err);
    }

    function checkPort() {
      if (port === 0) {
        doResolve();
        return;
      }

      // Testing whether a port is 'available' involves simply
      // trying to make a server listen on that port, and retrying
      // until it succeeds.
      const server = createHttpServer();
      const terminator = createHttpTerminator({
        server,
        gracefulTerminationTimeout: 0 // default 1000
      });

      server.on("error", (err) => {
        // @ts-expect-error non standard property on Error
        if (err.code !== "EADDRINUSE") {
          doReject(err);
        }
      });
      server.listen(port, () =>
        terminator
          .terminate()
          .then(doResolve, () =>
            logger.error("Failed to terminate the port checker.")
          )
      );
    }
  });
}

/**
 * `useInspector` is a hook for debugging Workers applications
 *  when using `partykit dev`.
 *
 * When we start a session with `partykit dev`, the Workers platform
 * also exposes a debugging websocket that implements the DevTools
 * Protocol. While we could just start up DevTools and connect to this
 * URL, that URL changes every time we make a change to the
 * worker, or when the session expires. Instead, we start up a proxy
 * server locally that acts as a bridge between the remote DevTools
 * server and the local DevTools instance. So whenever the URL changes,
 * we can can silently connect to it and keep the local DevTools instance
 * up to date. Further, we also intercept these messages and selectively
 * log them directly to the terminal (namely, calls to `console.<x>`,
 * and exceptions)
 */

/**
 * TODO:
 * - clear devtools whenever we save changes to the worker
 * - clear devtools when we switch between local/remote modes
 * - handle more methods from console
 */

// Information about partykit's bundling process that needs passsed through
// for DevTools sourcemap transformation
export interface SourceMapMetadata {
  tmpDir: string;
  entryDirectory: string;
}

interface InspectorProps {
  /**
   * The port that the local proxy server should listen on.
   */
  port: number;
  /**
   * The websocket URL exposed by Workers that the inspector should connect to.
   */
  inspectorUrl: string | undefined;
  /**
   * Whether console statements and exceptions should be logged to the terminal.
   * (We don't log them in local mode because they're already getting
   * logged to the terminal by nature of them actually running in node locally.)
   */
  logToTerminal: boolean;
  /**
   * Sourcemap path, so that stacktraces can be interpretted
   */
  sourceMapPath: string | undefined;

  sourceMapMetadata: SourceMapMetadata | undefined;

  host?: string;

  name?: string;
}

export default function useInspector(props: InspectorProps) {
  /** A unique ID for this session. */
  const inspectorIdRef = useRef(randomId());

  /** The websocket from the devtools instance. */
  const [localWebSocket, setLocalWebSocket] = useState<WebSocket>();
  /**  The websocket from the edge */
  const [remoteWebSocket, setRemoteWebSocket] = useState<WebSocket>();

  /**
   *  The local proxy server that acts as the bridge between
   *  the remote websocket and the local DevTools instance.
   */
  const serverRef = useRef<Server>();
  if (serverRef.current === undefined) {
    serverRef.current = createServer(
      (req: IncomingMessage, res: ServerResponse) => {
        switch (req.url) {
          // We implement a couple of well known end points
          // that are queried for metadata by chrome://inspect
          case "/json/version":
            res.setHeader("Content-Type", "application/json");
            res.end(
              JSON.stringify({
                Browser: `partykit/v${version}`,
                // TODO: (someday): The DevTools protocol should match that of Edge Worker.
                // This could be exposed by the preview API.
                "Protocol-Version": "1.3"
              })
            );
            return;
          case "/json":
          case "/json/list":
            {
              res.setHeader("Content-Type", "application/json");
              const localHost = `localhost:${props.port}/ws`;
              const devtoolsFrontendUrl = `devtools://devtools/bundled/js_app.html?experiments=true&v8only=true&ws=${localHost}`;
              const devtoolsFrontendUrlCompat = `devtools://devtools/bundled/inspector.html?experiments=true&v8only=true&ws=${localHost}`;
              res.end(
                JSON.stringify([
                  {
                    id: inspectorIdRef.current,
                    type: "node",
                    description: "workers",
                    webSocketDebuggerUrl: `ws://${localHost}`,
                    devtoolsFrontendUrl,
                    devtoolsFrontendUrlCompat,
                    // Below are fields that are visible in the DevTools UI.
                    title: "Cloudflare Worker",
                    faviconUrl: "https://workers.cloudflare.com/favicon.ico",
                    url:
                      "https://" +
                      (remoteWebSocket
                        ? new URL(remoteWebSocket.url).host
                        : "workers.dev")
                  }
                ])
              );
            }
            return;
          default:
            break;
        }
      }
    );
  }
  const server = serverRef.current;

  /**
   * The websocket server that runs on top of the proxy server.
   */
  const wsServerRef = useRef<WebSocketServer>();
  if (wsServerRef.current === undefined) {
    wsServerRef.current = new WebSocketServer({
      server,
      clientTracking: true
    });
  }
  const wsServer = wsServerRef.current;

  useEffect(() => {
    function onWSServerConnection(ws: WebSocket) {
      if (wsServer.clients.size > 1) {
        /** We only want to have one active Devtools instance at a time. */
        logger.error(
          "Tried to open a new devtools window when a previous one was already open."
        );
        ws.close(1013, "Too many clients; only one can be connected at a time");
      } else {
        // Since partykit proxies the inspector, reloading Chrome DevTools won't trigger debugger initialisation events (because it's connecting to an extant session).
        // This sends a `Debugger.disable` message to the remote when a new WebSocket connection is initialised,
        // with the assumption that the new connection will shortly send a `Debugger.enable` event and trigger re-initialisation.
        // The key initialisation messages that are needed are the `Debugger.scriptParsed events`.
        remoteWebSocket?.send(
          JSON.stringify({
            // This number is arbitrary, and is chosen to be high so as not to conflict with messages that DevTools might actually send.
            // For completeness, these options don't work: 0, -1, or Number.MAX_SAFE_INTEGER
            id: 100_000_000,
            method: "Debugger.disable"
          })
        );
        // As promised, save the created websocket in a state hook
        setLocalWebSocket(ws);

        ws.addEventListener("close", () => {
          // And and cleanup when devtools closes
          setLocalWebSocket(undefined);
        });
      }
    }
    wsServer.on("connection", onWSServerConnection);
    return () => {
      wsServer.off("connection", onWSServerConnection);
    };
  }, [remoteWebSocket, wsServer]);

  /**
   * We start and stop the server in an effect to take advantage
   * of the component lifecycle. Convenient.
   */
  useEffect(() => {
    const abortController = new AbortController();
    async function startInspectorProxy() {
      await waitForPortToBeAvailable(props.port, {
        retryPeriod: 200,
        timeout: 2000,
        abortSignal: abortController.signal
      });
      server.listen(props.port);
    }
    startInspectorProxy().catch((err) => {
      if ((err as { code: string }).code !== "ABORT_ERR") {
        logger.error("Failed to start inspector:", err);
      }
    });
    return () => {
      server.close();
      // Also disconnect any open websockets/devtools connections

      wsServer.clients.forEach((ws) => {
        ws.close();
      });
      wsServer.close();
      abortController.abort();
    };
  }, [props.port, server, wsServer]);

  /**
   * When connecting to the remote websocket, if we don't start either
   * the devtools instance or make an actual request to the worker in time,
   * then the connecting process can error out. When this happens, we
   * want to simply retry the connection. We use a state hook to trigger retries
   * of the effect that connects to the remote websocket.
   */
  const [
    retryRemoteWebSocketConnectionSigil,
    setRetryRemoteWebSocketConnectionSigil
  ] = useState<number>(0);
  function retryRemoteWebSocketConnection() {
    setRetryRemoteWebSocketConnectionSigil((x) => x + 1);
  }

  /** A simple incrementing id to attach to messages we send to devtools */
  const messageCounterRef = useRef(1);

  // This effect tracks the connection to the remote websocket
  // (stored in, no surprises here, `remoteWebSocket`)
  useEffect(() => {
    if (!props.inspectorUrl) {
      return;
    }

    // The actual websocket instance
    const ws = new WebSocket(props.inspectorUrl);
    setRemoteWebSocket(ws);

    /**
     * A handle to the interval we run to keep the websocket alive
     */
    let keepAliveInterval: ReturnType<typeof setInterval>;

    /**
     * Test if the websocket is closed
     */
    function isClosed() {
      return (
        ws.readyState === WebSocket.CLOSED ||
        ws.readyState === WebSocket.CLOSING
      );
    }

    /**
     * Send a message to the remote websocket
     */
    function send(event: Record<string, unknown>): void {
      if (!isClosed()) {
        ws.send(JSON.stringify(event));
      }
    }

    /**
     * Closes the inspector.
     */
    function close(): void {
      if (!isClosed() && ws.readyState !== WebSocket.CONNECTING) {
        try {
          ws.close();
        } catch (err) {
          // Closing before the websocket is ready will throw an error.
        }
      }
    }

    /**
     * Since we have a handle on the remote websocket, we can tap
     * into its events, and log any pertinent ones directly to
     * the terminal (which means you have insight into your worker
     * without having to open the devtools).
     */

    async function onMessage(event: MessageEvent) {
      if (typeof event.data === "string") {
        const evt = JSON.parse(event.data);
        if (evt.method === "Runtime.exceptionThrown") {
          const params = evt.params as Protocol.Runtime.ExceptionThrownEvent;

          // Parse stack trace with source map.
          if (props.sourceMapPath) {
            // Parse in the sourcemap
            const mapContent = JSON.parse(
              await readFile(props.sourceMapPath, "utf-8")
            );

            // Create the lines for the exception details log
            const exceptionLines = [
              params.exceptionDetails.exception?.description?.split("\n")[0]
            ];

            await SourceMapConsumer.with(mapContent, null, async (consumer) => {
              // Pass each of the callframes into the consumer, and format the error
              const stack = params.exceptionDetails.stackTrace?.callFrames;

              stack?.forEach(
                ({ functionName, lineNumber, columnNumber }, i) => {
                  try {
                    if (lineNumber) {
                      // The line and column numbers in the stackTrace are zero indexed,
                      // whereas the sourcemap consumer indexes from one.
                      const pos = consumer.originalPositionFor({
                        line: lineNumber + 1,
                        column: columnNumber + 1
                      });

                      // Print out line which caused error:
                      if (i === 0 && pos.source && pos.line) {
                        const fileSource = consumer.sourceContentFor(
                          pos.source
                        );
                        const fileSourceLine =
                          fileSource?.split("\n")[pos.line - 1] || "";
                        exceptionLines.push(fileSourceLine.trim());

                        // If we have a column, we can mark the position underneath
                        if (pos.column) {
                          exceptionLines.push(
                            `${" ".repeat(
                              pos.column - fileSourceLine.search(/\S/)
                            )}^`
                          );
                        }
                      }

                      // From the way esbuild implements the "names" field:
                      // > To save space, the original name is only recorded when it's different from the final name.
                      // however, source-map consumer does not handle this
                      if (pos && pos.line != null) {
                        const convertedFnName = pos.name || functionName || "";
                        exceptionLines.push(
                          `    at ${convertedFnName} (${pos.source}:${pos.line}:${pos.column})`
                        );
                      }
                    }
                  } catch {
                    // Line failed to parse through the sourcemap consumer
                    // We should handle this better
                  }
                }
              );
            });

            // Log the parsed stacktrace
            logger.error(
              params.exceptionDetails.text,
              exceptionLines.join("\n")
            );
          } else {
            // We log the stacktrace to the terminal
            logger.error(
              params.exceptionDetails.text,
              params.exceptionDetails.exception?.description ?? ""
            );
          }
        }
      } else {
        // We should never get here, but who know is 2022...
        logger.error("Unrecognised devtools event:", event);
      }
    }

    function onOpen() {
      send({ method: "Runtime.enable", id: messageCounterRef.current });
      // TODO: This doesn't actually work. Must fix.
      send({ method: "Network.enable", id: messageCounterRef.current++ });

      keepAliveInterval = setInterval(() => {
        send({
          method: "Runtime.getIsolateId",
          id: messageCounterRef.current++
        });
      }, 10_000);
    }

    function onUnexpectedResponse() {
      logger.log("Waiting for connection...");
      /**
       * This usually means the worker is not "ready" yet
       * so we'll just retry the connection process
       */
      retryRemoteWebSocketConnection();
    }

    function onClose() {
      clearInterval(keepAliveInterval);
    }

    if (props.logToTerminal) {
      ws.addEventListener("message", onMessage);
    }

    ws.addEventListener("open", onOpen);
    ws.on("unexpected-response", onUnexpectedResponse);
    ws.addEventListener("close", onClose);

    return () => {
      // clean up! Let's first stop the heartbeat interval
      clearInterval(keepAliveInterval);
      // Then we'll send a message to the devtools instance to
      // tell it to clear the console.
      wsServer.clients.forEach((client) => {
        // We could've used `localSocket` here, but
        // then we would have had to add it to the effect
        // change detection array, which would have made a
        // bunch of other stuff complicated. So we'll just
        // cycle through all of the server's connected clients
        // (in practice, there should only be one or zero) and send
        // the Log.clear message.
        client.send(
          JSON.stringify({
            // TODO: This doesn't actually work. Must fix.
            method: "Log.clear",
            // we can disable the next eslint warning since
            // we're referencing a ref that stays alive
            // eslint-disable-next-line react-hooks/exhaustive-deps
            id: messageCounterRef.current++,
            params: {}
          })
        );
      });

      // remove the listeners
      ws.removeEventListener("message", onMessage);
      ws.removeEventListener("open", onOpen);
      ws.off("unexpected-response", onUnexpectedResponse);
      ws.removeEventListener("close", onClose);

      // Finally, we'll close the websocket
      close();
      // And we'll clear `remoteWebsocket`
      setRemoteWebSocket(undefined);
    };
  }, [
    props.inspectorUrl,
    props.logToTerminal,
    props.sourceMapPath,
    wsServer,
    // We use a state value as a sigil to trigger a retry of the
    // remote websocket connection. It's not used inside the effect,
    // so react-hooks/exhaustive-deps doesn't complain if it's not
    // included in the dependency array. But its presence is critical,
    // so do NOT remove it from the dependency list.
    retryRemoteWebSocketConnectionSigil
  ]);

  /**
   * We want to make sure we don't lose any messages we receive from the
   * remote websocket before devtools connects. So we use a ref to buffer
   * messages, and flush them whenever devtools connects.
   */
  const messageBufferRef = useRef<MessageEvent[]>([]);

  // This effect tracks the state changes _between_ the local
  // and remote websockets, and handles how messages flow between them.
  useEffect(() => {
    /**
     * This event listener is used for buffering messages from
     * the remote websocket, and flushing them
     * when the local websocket connects.
     */
    function bufferMessageFromRemoteSocket(event: MessageEvent) {
      messageBufferRef.current.push(event);
      // TODO: maybe we should have a max limit on this?
      // if so, we should be careful when removing messages
      // from the front, because they could be critical for
      // devtools (like execution context creation, etc)
    }

    if (remoteWebSocket && !localWebSocket) {
      // The local websocket hasn't connected yet, so we'll
      // buffer messages until it does.
      remoteWebSocket.addEventListener(
        "message",
        bufferMessageFromRemoteSocket
      );
    }

    /** Send a message from the local websocket to the remote websocket */
    function sendMessageToRemoteWebSocket(event: MessageEvent) {
      try {
        // Intercept Network.loadNetworkResource to load sourcemaps
        const message = JSON.parse(event.data as string);
        if (
          message.method === "Network.loadNetworkResource" &&
          props.sourceMapPath !== undefined &&
          props.sourceMapMetadata !== undefined
        ) {
          // Read the generated source map from esbuild
          const sourceMap = JSON.parse(
            readFileSync(props.sourceMapPath, "utf-8")
          );

          // The source root is a temporary directory (`tmpDir`), and so shouldn't be user-visible
          // It provides no useful info to the user
          sourceMap.sourceRoot = "";

          const tmpDir = props.sourceMapMetadata.tmpDir;

          // See https://docs.google.com/document/d/1U1RGAehQwRypUTovF1KRlpiOFze0b-_2gc6fAH0KY0k/edit#heading=h.mt2g20loc2ct
          // The above link documents the x_google_ignoreList property, which is intended to mark code that shouldn't be visible in DevTools
          // Here we use it to indicate specifically partykit-injected code (facades & middleware)
          sourceMap.x_google_ignoreList = sourceMap.sources
            // Filter anything in the generated tmpDir, and anything from partykit's templates
            // This should cover facades and middleware, but intentionally doesn't include all non-user code e.g. node_modules
            .map((s: string, idx: number) =>
              s.includes(tmpDir) || s.includes("partykit/templates")
                ? idx
                : null
            )
            .filter((i: number | null) => i !== null);

          const entryDirectory = props.sourceMapMetadata.entryDirectory;

          sourceMap.sources = sourceMap.sources.map(
            (s: string) =>
              // These are never loaded by partykit or DevTools. However, the presence of a scheme is required for DevTools to show the path as folders in the Sources view
              // The scheme is intentially not the same as for the sourceMappingURL
              // Without this difference in scheme, DevTools will not strip prefix `../` path elements from top level folders (../node_modules -> node_modules, for instance)
              `worker://${props.name}/${path.relative(entryDirectory, s)}`
          );

          sendMessageToLocalWebSocket({
            data: JSON.stringify({
              id: message.id,
              result: {
                resource: {
                  success: true,
                  text: JSON.stringify(sourceMap)
                }
              }
            })
          });
          return;
        }
      } catch (e) {
        logger.debug(e);
        // Ignore errors, fallthrough to the remote inspector
      }
      try {
        assert(
          remoteWebSocket,
          "Trying to send a message to an undefined `remoteWebSocket`"
        );
        remoteWebSocket.send(event.data);
      } catch (e) {
        if (
          (e as Error).message !==
          "WebSocket is not open: readyState 0 (CONNECTING)"
        ) {
          /**
           * ^ this just means we haven't opened a websocket yet
           * usually happens until there's at least one request
           * which is weird, because we may miss something that
           * happens on the first request. Maybe we should buffer
           * these messages too?
           */
          logger.error(e);
        }
      }
    }

    /** Send a message from the local websocket to the remote websocket */
    function sendMessageToLocalWebSocket(event: Pick<MessageEvent, "data">) {
      assert(
        localWebSocket,
        "Trying to send a message to an undefined `localWebSocket`"
      );
      try {
        // Intercept Debugger.scriptParsed responses to inject URL schemes
        const message = JSON.parse(event.data as string);
        if (message.method === "Debugger.scriptParsed") {
          // Add the worker:// scheme conditionally, since some module types already have schemes (e.g. wasm)
          message.params.url = new URL(
            message.params.url,
            `worker://${props.name}`
          ).href;
          localWebSocket.send(JSON.stringify(message));
          return;
        }
      } catch (e) {
        logger.debug(e);
        // Ignore errors, fallthrough to the local websocket
      }

      localWebSocket.send(event.data);
    }

    if (localWebSocket && remoteWebSocket) {
      // Both the remote and local websockets are connected, so let's
      // start sending messages between them.
      localWebSocket.addEventListener("message", sendMessageToRemoteWebSocket);
      remoteWebSocket.addEventListener("message", sendMessageToLocalWebSocket);

      // Also, let's flush any buffered messages
      messageBufferRef.current.forEach(sendMessageToLocalWebSocket);
      messageBufferRef.current = [];
    }

    return () => {
      // Cleanup like good citizens
      if (remoteWebSocket) {
        remoteWebSocket.removeEventListener(
          "message",
          bufferMessageFromRemoteSocket
        );
        remoteWebSocket.removeEventListener(
          "message",
          sendMessageToLocalWebSocket
        );
      }
      if (localWebSocket) {
        localWebSocket.removeEventListener(
          "message",
          sendMessageToRemoteWebSocket
        );
      }
    };
  }, [
    localWebSocket,
    remoteWebSocket,
    props.name,
    props.sourceMapMetadata,
    props.sourceMapPath
  ]);
}

// Credit: https://stackoverflow.com/a/2117523
function randomId(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Opens the chrome debugger
 */
export const openInspector = async (
  inspectorPort: number,
  worker: string | undefined
) => {
  const query = new URLSearchParams();
  query.set("theme", "systemPreferred");
  query.set("ws", `localhost:${inspectorPort}/ws`);
  if (worker) query.set("domain", worker);
  const url = `https://devtools.devprod.cloudflare.dev/js_app?${query.toString()}`;
  const errorMessage =
    "Failed to open inspector.\nInspector depends on having a Chromium-based browser installed, maybe you need to install one?";

  // see: https://github.com/sindresorhus/open/issues/177#issue-610016699
  let braveBrowser: string;
  switch (os.platform()) {
    case "darwin":
    case "win32":
      braveBrowser = "Brave";
      break;
    default:
      braveBrowser = "brave";
  }

  const childProcess = await open(url, {
    app: [
      {
        name: openApps.chrome
      },
      {
        name: braveBrowser
      },
      {
        name: openApps.edge
      },
      {
        name: openApps.firefox
      }
    ]
  });
  childProcess.on("error", () => {
    logger.warn(errorMessage);
  });
};
