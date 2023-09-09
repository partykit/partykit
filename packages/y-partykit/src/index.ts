import * as Y from "yjs";
import * as syncProtocol from "y-protocols/sync";
import * as awarenessProtocol from "y-protocols/awareness";
import * as encoding from "lib0/encoding";
import * as decoding from "lib0/decoding";

import debounce from "lodash.debounce";
import type * as Party from "partykit/server";
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
  conns: Map<Party.Connection, Set<number>>;
  awareness: awarenessProtocol.Awareness;
  storage: YPartyKitStorage | undefined;
  persist: boolean;
  gc: boolean;

  constructor(room: Party.Party, options: YPartyKitOptions) {
    super({ gc: options.gc ?? !options.persist });
    this.gc = options.gc ?? !options.persist;
    this.name = room.id;
    this.persist = options.persist ?? false;

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
      conn: Party.Connection | null // Origin is the connection that made the change
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
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return doc.getXmlElement(objName);
    default:
      return {};
  }
}

/**
 * Gets a Y.Doc by name, whether in memory or on disk
 */
async function getYDoc(
  // docname: string, // the name of the Y.Doc to find or create
  room: Party.Party,
  options: YPartyKitOptions
): Promise<WSSharedDoc> {
  let doc = docs.get(room.id);
  if (doc) {
    return doc;
  }

  doc = new WSSharedDoc(room, options);

  const { callback, load } = options;

  // allow caller to provide initial document state
  if (load) {
    const src = await load();
    const state = Y.encodeStateAsUpdate(src);
    Y.applyUpdate(doc, state);
  }

  if (callback !== undefined) {
    doc.on(
      "update",
      debounce(
        (update: Uint8Array, origin: Party.Connection, doc: WSSharedDoc) => {
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
                ...(callback.headers && Object.fromEntries(callback.headers)),
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
    await doc.bindState();
  }

  docs.set(room.id, doc);
  return doc;
}

function readSyncMessage(
  decoder: decoding.Decoder,
  encoder: encoding.Encoder,
  doc: Y.Doc,
  transactionOrigin: Party.Connection,
  readOnly = false
) {
  const messageType = decoding.readVarUint(decoder);
  switch (messageType) {
    case syncProtocol.messageYjsSyncStep1:
      syncProtocol.readSyncStep1(decoder, encoder, doc);
      break;
    case syncProtocol.messageYjsSyncStep2:
      if (!readOnly)
        syncProtocol.readSyncStep2(decoder, doc, transactionOrigin);
      break;
    case syncProtocol.messageYjsUpdate:
      if (!readOnly) syncProtocol.readUpdate(decoder, doc, transactionOrigin);
      break;
    default:
      throw new Error("Unknown message type");
  }
  return messageType;
}

function messageListener(
  conn: Party.Connection,
  doc: WSSharedDoc,
  message: Uint8Array,
  readOnly: boolean
): void {
  try {
    const encoder = encoding.createEncoder();
    const decoder = decoding.createDecoder(message);
    const messageType = decoding.readVarUint(decoder);
    switch (messageType) {
      case messageSync:
        encoding.writeVarUint(encoder, messageSync);
        readSyncMessage(decoder, encoder, doc, conn, readOnly);

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

function closeConn(doc: WSSharedDoc, conn: Party.Connection): void {
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

function send(doc: WSSharedDoc, conn: Party.Connection, m: Uint8Array) {
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
// TODO: Add a runtime check for this

interface HandlerCallbackOptions extends CallbackOptions {
  handler: (doc: Y.Doc) => void;
  url?: never;
}

interface UrlCallbackOptions extends CallbackOptions {
  handler?: never;
  url: string;
  headers?: Headers;
}

type YPartyKitCallbackOptions = HandlerCallbackOptions | UrlCallbackOptions;

export type YPartyKitOptions = {
  /**
   * disable gc when using snapshots!
   * */
  gc?: boolean;
  persist?: boolean;
  callback?: YPartyKitCallbackOptions;
  load?: () => Promise<Y.Doc>;
  readOnly?: boolean;
};

export async function onConnect(
  conn: Party.Connection,
  room: Party.Party,
  opts: YPartyKitOptions = {}
) {
  // conn.binaryType = "arraybuffer"; // from y-websocket, breaks in our runtime

  const options = { ...opts };

  if (options.gc && options.persist) {
    throw new Error("Cannot use gc and persist at the same time");
  }

  if (
    options.gc === undefined &&
    (options.persist === undefined || options.persist === false)
  ) {
    options.gc = true;
    options.persist = false;
  }

  if (options.gc === undefined && options.persist === true) {
    options.gc = false;
  }

  // get doc, initialize if it does not exist yet
  const doc = await getYDoc(room, options);
  doc.conns.set(conn, new Set());
  // listen and reply to events
  conn.addEventListener("message", (message) => {
    if (typeof message.data !== "string") {
      return messageListener(
        conn,
        doc,
        new Uint8Array(message.data),
        options.readOnly ?? false
      );
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
