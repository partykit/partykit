// Our dev environment has a problem where yjs doesn't
// "work", so we use a special build
import * as Y from "yjs";
import * as syncProtocol from "y-protocols/sync";
import * as awarenessProtocol from "y-protocols/awareness";
import * as encoding from "lib0/encoding";
import * as decoding from "lib0/decoding";
import * as map from "lib0/map";

import debounce from "lodash.debounce";
import type { PartyKitRoom } from "partykit/server";
import { YPartyKitStorage } from "./storage";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

const wsReadyStateConnecting = 0;
const wsReadyStateOpen = 1;
const wsReadyStateClosing = 2; // eslint-disable-line
const wsReadyStateClosed = 3; // eslint-disable-line

const docs: Map<string, WSSharedDoc> = new Map();

const messageSync = 0;
const messageAwareness = 1;
// const messageAuth = 2

function updateHandler(update: Uint8Array, origin: unknown, doc: WSSharedDoc) {
  const encoder = encoding.createEncoder();
  encoding.writeVarUint(encoder, messageSync);
  syncProtocol.writeUpdate(encoder, update);
  const message = encoding.toUint8Array(encoder);
  doc.conns.forEach((_, conn) => send(doc, conn, message));
}

class WSSharedDoc extends Y.Doc {
  name: string;
  conns: Map<WebSocket, Set<number>>;
  awareness: awarenessProtocol.Awareness;
  storage: YPartyKitStorage | undefined;
  persist: boolean;

  constructor(room: PartyKitRoom, options: YPartyKitOptions) {
    super({ gc: options.gc || false });
    this.name = room.id;
    this.persist = options.persist || false;

    if (options.persist) {
      this.storage = new YPartyKitStorage(room.storage);
    }
    /**
     * Maps from conn to set of controlled user ids. Delete all user ids from awareness when this conn is closed
     */
    this.conns = new Map();

    this.awareness = new awarenessProtocol.Awareness(this);
    this.awareness.setLocalState(null);

    const awarenessChangeHandler = (
      {
        added,
        updated,
        removed,
      }: {
        added: Array<number>;
        updated: Array<number>;
        removed: Array<number>;
      },
      conn: WebSocket | null // Origin is the connection that made the change
    ) => {
      const changedClients = added.concat(updated, removed);
      if (conn !== null) {
        const connControlledIDs =
          /** @type {Set<number>} */ this.conns.get(conn);
        if (connControlledIDs !== undefined) {
          added.forEach((clientID) => {
            connControlledIDs.add(clientID);
          });
          removed.forEach((clientID) => {
            connControlledIDs.delete(clientID);
          });
        }
      }
      // broadcast awareness update
      const encoder = encoding.createEncoder();
      encoding.writeVarUint(encoder, messageAwareness);
      encoding.writeVarUint8Array(
        encoder,
        awarenessProtocol.encodeAwarenessUpdate(this.awareness, changedClients)
      );
      const buff = encoding.toUint8Array(encoder);
      this.conns.forEach((_, c) => {
        send(this, c, buff);
      });
    };
    this.awareness.on("update", awarenessChangeHandler);
    this.on("update", updateHandler);
  }

  async bindState() {
    assert(this.storage, "Storage not set");
    const persistedYdoc = await this.storage.getYDoc(this.name);
    const newUpdates = Y.encodeStateAsUpdate(this);
    await this.storage.storeUpdate(this.name, newUpdates);
    Y.applyUpdate(this, Y.encodeStateAsUpdate(persistedYdoc));
    this.on("update", (update) => {
      assert(this.storage, "Storage not set");
      this.storage.storeUpdate(this.name, update).catch((e) => {
        console.error("Error storing update", e);
      });
    });
  }
  async writeState() {
    assert(this.storage, "Storage not set");
    const newUpdates = Y.encodeStateAsUpdate(this);
    await this.storage.storeUpdate(this.name, newUpdates);
  }
}

const CALLBACK_DEFAULTS = {
  debounceWait: 2000,
  debounceMaxWait: 10000,
  timeout: 5000,
  objects: {},
};

function getContent(objName: string, objType: string, doc: WSSharedDoc) {
  switch (objType) {
    case "Array":
      return doc.getArray(objName);
    case "Map":
      return doc.getMap(objName);
    case "Text":
      return doc.getText(objName);
    case "XmlFragment":
      return doc.getXmlFragment(objName);
    case "XmlElement":
      // @ts-expect-error - XmlElement is not exported from yjs?
      return doc.getXmlElement(objName);
    default:
      return {};
  }
}

/**
 * Gets a Y.Doc by name, whether in memory or on disk
 */
function getYDoc(
  // docname: string, // the name of the Y.Doc to find or create
  room: PartyKitRoom,
  options: YPartyKitOptions
): WSSharedDoc {
  return map.setIfUndefined(docs, room.id, () => {
    const { callback } = options;
    const doc = new WSSharedDoc(room, options);
    doc.gc = options.gc || false; // TODO: is this necessary?
    if (callback !== undefined) {
      doc.on(
        "update",
        debounce(
          (update: Uint8Array, origin: WebSocket, doc: WSSharedDoc) => {
            const dataToSend = {
              room: doc.name,
              data: {},
            };

            const callbackObjects: Record<string, string> =
              callback.objects || CALLBACK_DEFAULTS.objects;

            const sharedObjectList = Object.keys(callbackObjects);
            sharedObjectList.forEach((sharedObjectName) => {
              const sharedObjectType = callbackObjects[sharedObjectName];
              // @ts-expect-error - TODO: fix this
              dataToSend.data[sharedObjectName] = {
                type: sharedObjectType,
                content: getContent(
                  sharedObjectName,
                  sharedObjectType,
                  doc
                ).toJSON(),
              };
            });

            if (callback.url) {
              // POST to the callback URL
              fetch(callback.url, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(dataToSend),
                signal: AbortSignal.timeout(
                  callback.timeout || CALLBACK_DEFAULTS.timeout
                ),
              }).catch((err) => {
                console.error("failed to persist", err);
              });
            }

            if (callback.handler) {
              callback.handler(doc);
            }
          },
          callback.debounceWait || CALLBACK_DEFAULTS.debounceWait,
          {
            maxWait:
              callback.debounceMaxWait || CALLBACK_DEFAULTS.debounceMaxWait,
          }
        )
      );
    }

    if (doc.persist) {
      doc.bindState().catch((e) => {
        console.error("Error binding state", e);
      });
    }

    docs.set(room.id, doc);
    return doc;
  });
}

function messageListener(
  conn: WebSocket,
  doc: WSSharedDoc,
  message: Uint8Array
): void {
  try {
    const encoder = encoding.createEncoder();
    const decoder = decoding.createDecoder(message);
    const messageType = decoding.readVarUint(decoder);
    switch (messageType) {
      case messageSync:
        encoding.writeVarUint(encoder, messageSync);
        syncProtocol.readSyncMessage(decoder, encoder, doc, null);

        // If the `encoder` only contains the type of reply message and no
        // message, there is no need to send the message. When `encoder` only
        // contains the type of reply, its length is 1.
        if (encoding.length(encoder) > 1) {
          send(doc, conn, encoding.toUint8Array(encoder));
        }
        break;
      case messageAwareness: {
        awarenessProtocol.applyAwarenessUpdate(
          doc.awareness,
          decoding.readVarUint8Array(decoder),
          conn
        );
        break;
      }
    }
  } catch (err) {
    console.error(err);
    doc.emit("error", [err]);
  }
}

function closeConn(doc: WSSharedDoc, conn: WebSocket): void {
  if (doc.conns.has(conn)) {
    const controlledIds: Set<number> = doc.conns.get(conn) as Set<number>;
    doc.conns.delete(conn);
    awarenessProtocol.removeAwarenessStates(
      doc.awareness,
      Array.from(controlledIds),
      null
    );
    if (doc.conns.size === 0 && doc.persist) {
      // if persisted, we store state and destroy ydocument
      doc.writeState().then(
        () => {
          doc.destroy();
        },
        (err) => {
          doc.emit("error", [err]);
        }
      );

      docs.delete(doc.name);
    }
  }
  try {
    conn.close();
  } catch (e) {
    console.warn("failed to close connection", e);
  }
}

function send(doc: WSSharedDoc, conn: WebSocket, m: Uint8Array) {
  if (
    conn.readyState !== undefined &&
    conn.readyState !== wsReadyStateConnecting &&
    conn.readyState !== wsReadyStateOpen
  ) {
    closeConn(doc, conn);
  }
  try {
    conn.send(
      m
      // /** @param {any} err */ (err) => {
      //   err != null && closeConn(doc, conn);
      // }
    );
  } catch (e) {
    closeConn(doc, conn);
  }
}

const pingTimeout = 30000;

interface CallbackOptions {
  debounceWait?: number;
  debounceMaxWait?: number;
  timeout?: number;
  objects?: Record<string, string>;
}

// Either handler or url needs to be defined, but not both

interface HandlerCallbackOptions extends CallbackOptions {
  handler: (doc: Y.Doc) => void;
  url?: never;
}

interface UrlCallbackOptions extends CallbackOptions {
  handler?: never;
  url: string;
}

type YPartyKitCallbackOptions = HandlerCallbackOptions | UrlCallbackOptions;

export type YPartyKitOptions = {
  /**
   * disable gc when using snapshots!
   * */
  gc?: boolean;
  persist?: boolean;
  callback?: YPartyKitCallbackOptions;
};

export function onConnect(
  conn: WebSocket,
  room: PartyKitRoom,
  options: YPartyKitOptions = {}
) {
  // conn.binaryType = "arraybuffer"; // from y-websocket, breaks in our runtime

  // get doc, initialize if it does not exist yet
  const doc = getYDoc(room, options);
  doc.conns.set(conn, new Set());
  // listen and reply to events
  conn.addEventListener("message", async (message) => {
    if (typeof message.data !== "string") {
      return messageListener(conn, doc, new Uint8Array(message.data));
    } else {
      // silently ignore anything else
    }
  });

  // Check if connection is still alive
  let pongReceived = true;
  const pingInterval = setInterval(() => {
    if (!pongReceived) {
      if (doc.conns.has(conn)) {
        closeConn(doc, conn);
      }
      clearInterval(pingInterval);
    } else if (doc.conns.has(conn)) {
      pongReceived = false;
      try {
        conn.send("ping");
      } catch (e) {
        closeConn(doc, conn);
        clearInterval(pingInterval);
      }
    }
  }, pingTimeout);
  conn.addEventListener("close", () => {
    closeConn(doc, conn);
    clearInterval(pingInterval);
  });
  conn.addEventListener("message", (message) => {
    if (message.data === "pong") {
      pongReceived = true;
    }
  });
  // put the following in a variables in a block so the interval handlers don't keep in in
  // scope
  {
    // send sync step 1
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, messageSync);
    syncProtocol.writeSyncStep1(encoder, doc);
    send(doc, conn, encoding.toUint8Array(encoder));
    const awarenessStates = doc.awareness.getStates();
    if (awarenessStates.size > 0) {
      const encoder = encoding.createEncoder();
      encoding.writeVarUint(encoder, messageAwareness);
      encoding.writeVarUint8Array(
        encoder,
        awarenessProtocol.encodeAwarenessUpdate(
          doc.awareness,
          Array.from(awarenessStates.keys())
        )
      );
      send(doc, conn, encoding.toUint8Array(encoder));
    }
  }
}
