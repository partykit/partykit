import * as Y from "yjs"; // eslint-disable-line
import * as bc from "lib0/broadcastchannel";
import * as time from "lib0/time";
import * as encoding from "lib0/encoding";
import * as decoding from "lib0/decoding";
import * as syncProtocol from "y-protocols/sync";
import * as authProtocol from "y-protocols/auth";
import * as awarenessProtocol from "y-protocols/awareness";
import { Observable } from "lib0/observable";
import * as math from "lib0/math";
import * as url from "lib0/url";

export const messageSync = 0;
export const messageQueryAwareness = 3;
export const messageAwareness = 1;
export const messageAuth = 2;

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

const messageHandlers: Array<
  (
    encoder: encoding.Encoder,
    decoder: decoding.Decoder,
    provider: WebsocketProvider,
    emitSynced: boolean,
    messageType: number
  ) => void
> = [];

messageHandlers[messageSync] = (
  encoder,
  decoder,
  provider,
  emitSynced,
  _messageType
) => {
  encoding.writeVarUint(encoder, messageSync);
  const syncMessageType = syncProtocol.readSyncMessage(
    decoder,
    encoder,
    provider.doc,
    provider
  );
  if (
    emitSynced &&
    syncMessageType === syncProtocol.messageYjsSyncStep2 &&
    !provider.synced
  ) {
    provider.synced = true;
  }
};

messageHandlers[messageQueryAwareness] = (
  encoder,
  _decoder,
  provider,
  _emitSynced,
  _messageType
) => {
  encoding.writeVarUint(encoder, messageAwareness);
  encoding.writeVarUint8Array(
    encoder,
    awarenessProtocol.encodeAwarenessUpdate(
      provider.awareness,
      Array.from(provider.awareness.getStates().keys())
    )
  );
};

messageHandlers[messageAwareness] = (
  _encoder,
  decoder,
  provider,
  _emitSynced,
  _messageType
) => {
  awarenessProtocol.applyAwarenessUpdate(
    provider.awareness,
    decoding.readVarUint8Array(decoder),
    provider
  );
};

messageHandlers[messageAuth] = (
  _encoder,
  decoder,
  provider,
  _emitSynced,
  _messageType
) => {
  authProtocol.readAuthMessage(decoder, provider.doc, (_ydoc, reason) =>
    permissionDeniedHandler(provider, reason)
  );
};

// @todo - this should depend on awareness.outdatedTime
const messageReconnectTimeout = 30000;

function permissionDeniedHandler(provider: WebsocketProvider, reason: string) {
  console.warn(`Permission denied to access ${provider.url}.\n${reason}`);
}

function readMessage(
  provider: WebsocketProvider,
  buf: Uint8Array,
  emitSynced: boolean
): encoding.Encoder {
  const decoder = decoding.createDecoder(buf);
  const encoder = encoding.createEncoder();
  const messageType = decoding.readVarUint(decoder);
  const messageHandler = provider.messageHandlers[messageType];
  if (/** @type {any} */ messageHandler) {
    messageHandler(encoder, decoder, provider, emitSynced, messageType);
  } else {
    console.error("Unable to compute message");
  }
  return encoder;
}

function setupWS(provider: WebsocketProvider) {
  if (provider.shouldConnect && provider.ws === null) {
    const websocket = new provider._WS(provider.url);
    websocket.binaryType = "arraybuffer";
    provider.ws = websocket;
    provider.wsconnecting = true;
    provider.wsconnected = false;
    provider.synced = false;

    websocket.onmessage = (event) => {
      if (event.data === "ping") {
        websocket.send("pong");
        return;
      }
      provider.wsLastMessageReceived = time.getUnixTime();
      const encoder = readMessage(provider, new Uint8Array(event.data), true);
      if (encoding.length(encoder) > 1) {
        websocket.send(encoding.toUint8Array(encoder));
      }
    };
    websocket.onerror = (event) => {
      provider.emit("connection-error", [event, provider]);
    };
    websocket.onclose = (event) => {
      provider.emit("connection-close", [event, provider]);
      provider.ws = null;
      provider.wsconnecting = false;
      if (provider.wsconnected) {
        provider.wsconnected = false;
        provider.synced = false;
        // update awareness (all users except local left)
        awarenessProtocol.removeAwarenessStates(
          provider.awareness,
          Array.from(provider.awareness.getStates().keys()).filter(
            (client) => client !== provider.doc.clientID
          ),
          provider
        );
        provider.emit("status", [
          {
            status: "disconnected",
          },
        ]);
      } else {
        provider.wsUnsuccessfulReconnects++;
      }
      // Start with no reconnect timeout and increase timeout by
      // using exponential backoff starting with 100ms
      setTimeout(
        setupWS,
        math.min(
          math.pow(2, provider.wsUnsuccessfulReconnects) * 100,
          provider.maxBackoffTime
        ),
        provider
      );
    };
    websocket.onopen = () => {
      provider.wsLastMessageReceived = time.getUnixTime();
      provider.wsconnecting = false;
      provider.wsconnected = true;
      provider.wsUnsuccessfulReconnects = 0;
      provider.emit("status", [
        {
          status: "connected",
        },
      ]);
      // always send sync step 1 when connected
      const encoder = encoding.createEncoder();
      encoding.writeVarUint(encoder, messageSync);
      syncProtocol.writeSyncStep1(encoder, provider.doc);
      websocket.send(encoding.toUint8Array(encoder));
      // broadcast local awareness state
      if (provider.awareness.getLocalState() !== null) {
        const encoderAwarenessState = encoding.createEncoder();
        encoding.writeVarUint(encoderAwarenessState, messageAwareness);
        encoding.writeVarUint8Array(
          encoderAwarenessState,
          awarenessProtocol.encodeAwarenessUpdate(provider.awareness, [
            provider.doc.clientID,
          ])
        );
        websocket.send(encoding.toUint8Array(encoderAwarenessState));
      }
    };
    provider.emit("status", [
      {
        status: "connecting",
      },
    ]);
  }
}

function broadcastMessage(provider: WebsocketProvider, buf: ArrayBuffer) {
  const ws = provider.ws;
  if (provider.wsconnected && ws && ws.readyState === ws.OPEN) {
    ws.send(buf);
  }
  if (provider.bcconnected) {
    bc.publish(provider.bcChannel, buf, provider);
  }
}

type AwarenessUpdate = {
  added: number[];
  updated: number[];
  removed: number[];
};

/**
 * Websocket Provider for Yjs. Creates a websocket connection to sync the shared document.
 * The document name is attached to the provided url. I.e. the following example
 * creates a websocket connection to http://localhost:1234/my-document-name
 *
 * @example
 *   import * as Y from 'yjs'
 *   import { WebsocketProvider } from 'y-websocket'
 *   const doc = new Y.Doc()
 *   const provider = new WebsocketProvider('http://localhost:1234', 'my-document-name', doc)
 *
 * @extends {Observable<string>}
 */
export class WebsocketProvider extends Observable<string> {
  maxBackoffTime: number;
  bcChannel: string;
  url: string;
  roomname: string;
  doc: Y.Doc;
  _WS: typeof WebSocket;
  awareness: awarenessProtocol.Awareness;
  wsconnected: boolean;
  wsconnecting: boolean;
  bcconnected: boolean;
  disableBc: boolean;
  wsUnsuccessfulReconnects: number;
  messageHandlers: typeof messageHandlers;
  _synced: boolean;
  ws: WebSocket | null;
  wsLastMessageReceived: number;
  shouldConnect: boolean; // Whether to connect to other peers or not
  _resyncInterval: ReturnType<typeof setInterval> | number;
  _bcSubscriber: (message: Uint8Array, origin: unknown) => void;
  _updateHandler: (update: Uint8Array, origin: unknown) => void;
  _awarenessUpdateHandler: (update: AwarenessUpdate, origin: unknown) => void;
  _unloadHandler: () => void;
  _checkInterval: ReturnType<typeof setInterval> | number;

  constructor(
    serverUrl: string,
    roomname: string,
    doc: Y.Doc,
    {
      connect = true,
      awareness = new awarenessProtocol.Awareness(doc),
      params = {},
      WebSocketPolyfill = WebSocket, // Optionally provide a WebSocket polyfill
      resyncInterval = -1, // Request server state every `resyncInterval` milliseconds
      maxBackoffTime = 2500, // Maximum amount of time to wait before trying to reconnect (we try to reconnect using exponential backoff)
      disableBc = false, // Disable cross-tab BroadcastChannel communication
    }: {
      connect?: boolean;
      awareness?: awarenessProtocol.Awareness;
      params?: { [s: string]: string };
      WebSocketPolyfill?: typeof WebSocket;
      resyncInterval?: number;
      maxBackoffTime?: number;
      disableBc?: boolean;
    } = {}
  ) {
    super();
    // ensure that url is always ends with /
    while (serverUrl[serverUrl.length - 1] === "/") {
      serverUrl = serverUrl.slice(0, serverUrl.length - 1);
    }
    const encodedParams = url.encodeQueryParams(params);
    this.maxBackoffTime = maxBackoffTime;
    this.bcChannel = serverUrl + "/" + roomname;
    this.url =
      serverUrl +
      "/" +
      roomname +
      (encodedParams.length === 0 ? "" : "?" + encodedParams);
    this.roomname = roomname;
    this.doc = doc;
    this._WS = WebSocketPolyfill;
    this.awareness = awareness;
    this.wsconnected = false;
    this.wsconnecting = false;
    this.bcconnected = false;
    this.disableBc = disableBc;
    this.wsUnsuccessfulReconnects = 0;
    this.messageHandlers = messageHandlers.slice();

    this._synced = false;

    this.ws = null;
    this.wsLastMessageReceived = 0;

    this.shouldConnect = connect;

    this._resyncInterval = 0;
    if (resyncInterval > 0) {
      this._resyncInterval = /** @type {any} */ setInterval(() => {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          // resend sync step 1
          const encoder = encoding.createEncoder();
          encoding.writeVarUint(encoder, messageSync);
          syncProtocol.writeSyncStep1(encoder, doc);
          this.ws.send(encoding.toUint8Array(encoder));
        }
      }, resyncInterval);
    }

    this._bcSubscriber = (data: ArrayBuffer, origin: unknown) => {
      if (origin !== this) {
        const encoder = readMessage(this, new Uint8Array(data), false);
        if (encoding.length(encoder) > 1) {
          bc.publish(this.bcChannel, encoding.toUint8Array(encoder), this);
        }
      }
    };
    /**
     * Listens to Yjs updates and sends them to remote peers (ws and broadcastchannel)
     */
    this._updateHandler = (update: Uint8Array, origin: unknown) => {
      if (origin !== this) {
        const encoder = encoding.createEncoder();
        encoding.writeVarUint(encoder, messageSync);
        syncProtocol.writeUpdate(encoder, update);
        broadcastMessage(this, encoding.toUint8Array(encoder));
      }
    };
    this.doc.on("update", this._updateHandler);

    this._awarenessUpdateHandler = (
      { added, updated, removed }: AwarenessUpdate,
      _origin: unknown
    ) => {
      const changedClients = added.concat(updated).concat(removed);
      const encoder = encoding.createEncoder();
      encoding.writeVarUint(encoder, messageAwareness);
      encoding.writeVarUint8Array(
        encoder,
        awarenessProtocol.encodeAwarenessUpdate(awareness, changedClients)
      );
      broadcastMessage(this, encoding.toUint8Array(encoder));
    };
    this._unloadHandler = () => {
      awarenessProtocol.removeAwarenessStates(
        this.awareness,
        [doc.clientID],
        "window unload"
      );
    };
    if (typeof window !== "undefined") {
      window.addEventListener("unload", this._unloadHandler);
    } else if (typeof process !== "undefined") {
      process.on("exit", this._unloadHandler);
    }
    awareness.on("update", this._awarenessUpdateHandler);
    this._checkInterval = /** @type {any} */ setInterval(() => {
      if (
        this.wsconnected &&
        messageReconnectTimeout <
          time.getUnixTime() - this.wsLastMessageReceived
      ) {
        assert(this.ws !== null, "ws must not be null");
        // no message received in a long time - not even your own awareness
        // updates (which are updated every 15 seconds)
        this.ws.close();
      }
    }, messageReconnectTimeout / 10);
    if (connect) {
      this.connect();
    }
  }

  /**
   * @type {boolean}
   */
  get synced() {
    return this._synced;
  }

  set synced(state) {
    if (this._synced !== state) {
      this._synced = state;
      this.emit("synced", [state]);
      this.emit("sync", [state]);
    }
  }

  destroy() {
    if (this._resyncInterval !== 0) {
      clearInterval(this._resyncInterval);
    }
    clearInterval(this._checkInterval);
    this.disconnect();
    if (typeof window !== "undefined") {
      window.removeEventListener("unload", this._unloadHandler);
    } else if (typeof process !== "undefined") {
      process.off("exit", this._unloadHandler);
    }
    this.awareness.off("update", this._awarenessUpdateHandler);
    this.doc.off("update", this._updateHandler);
    super.destroy();
  }

  connectBc() {
    if (this.disableBc) {
      return;
    }
    if (!this.bcconnected) {
      bc.subscribe(this.bcChannel, this._bcSubscriber);
      this.bcconnected = true;
    }
    // send sync step1 to bc
    // write sync step 1
    const encoderSync = encoding.createEncoder();
    encoding.writeVarUint(encoderSync, messageSync);
    syncProtocol.writeSyncStep1(encoderSync, this.doc);
    bc.publish(this.bcChannel, encoding.toUint8Array(encoderSync), this);
    // broadcast local state
    const encoderState = encoding.createEncoder();
    encoding.writeVarUint(encoderState, messageSync);
    syncProtocol.writeSyncStep2(encoderState, this.doc);
    bc.publish(this.bcChannel, encoding.toUint8Array(encoderState), this);
    // write queryAwareness
    const encoderAwarenessQuery = encoding.createEncoder();
    encoding.writeVarUint(encoderAwarenessQuery, messageQueryAwareness);
    bc.publish(
      this.bcChannel,
      encoding.toUint8Array(encoderAwarenessQuery),
      this
    );
    // broadcast local awareness state
    const encoderAwarenessState = encoding.createEncoder();
    encoding.writeVarUint(encoderAwarenessState, messageAwareness);
    encoding.writeVarUint8Array(
      encoderAwarenessState,
      awarenessProtocol.encodeAwarenessUpdate(this.awareness, [
        this.doc.clientID,
      ])
    );
    bc.publish(
      this.bcChannel,
      encoding.toUint8Array(encoderAwarenessState),
      this
    );
  }

  disconnectBc() {
    // broadcast message with local awareness state set to null (indicating disconnect)
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, messageAwareness);
    encoding.writeVarUint8Array(
      encoder,
      awarenessProtocol.encodeAwarenessUpdate(
        this.awareness,
        [this.doc.clientID],
        new Map()
      )
    );
    broadcastMessage(this, encoding.toUint8Array(encoder));
    if (this.bcconnected) {
      bc.unsubscribe(this.bcChannel, this._bcSubscriber);
      this.bcconnected = false;
    }
  }

  disconnect() {
    this.shouldConnect = false;
    this.disconnectBc();
    if (this.ws !== null) {
      this.ws.close();
    }
  }

  connect() {
    this.shouldConnect = true;
    if (!this.wsconnected && this.ws === null) {
      setupWS(this);
      this.connectBc();
    }
  }
}

function generateUUID(): string {
  // Public Domain/MIT
  if (crypto.randomUUID) {
    return crypto.randomUUID();
  }
  let d = new Date().getTime(); //Timestamp
  let d2 =
    (typeof performance !== "undefined" &&
      performance.now &&
      performance.now() * 1000) ||
    0; //Time in microseconds since page-load or 0 if unsupported
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    let r = Math.random() * 16; //random number between 0 and 16
    if (d > 0) {
      //Use timestamp until depleted
      r = (d + r) % 16 | 0;
      d = Math.floor(d / 16);
    } else {
      //Use microseconds since page-load if supported
      r = (d2 + r) % 16 | 0;
      d2 = Math.floor(d2 / 16);
    }
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export default class YPartyKitProvider extends WebsocketProvider {
  id: string;
  constructor(
    host: string,
    room: string,
    doc: Y.Doc,
    options: ConstructorParameters<typeof WebsocketProvider>[3] = {}
  ) {
    const serverUrl = `${
      host.startsWith("localhost:") || host.startsWith("127.0.0.1:")
        ? "ws"
        : "wss"
    }://${host}/party`;
    const id = generateUUID();
    if (options.params === undefined) {
      options.params = {
        _pk: id,
      };
    } else {
      options.params._pk = id;
    }
    super(serverUrl, room, doc, options);
    this.id = id;
  }
}
