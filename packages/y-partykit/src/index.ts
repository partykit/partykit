import type * as Party from "partykit/server";
import * as decoding from "lib0/decoding";
import * as encoding from "lib0/encoding";
import debounce from "lodash.debounce";
import * as awarenessProtocol from "y-protocols/awareness";
import * as syncProtocol from "y-protocols/sync";
import { applyUpdate, encodeStateAsUpdate, Doc as YDoc } from "yjs";

import { handleChunked } from "./chunking";
import { YPartyKitStorage } from "./storage";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

const MAX_BYTES = 10_000_000;
const MAX_UPDATES = Number.MAX_SAFE_INTEGER;

const wsReadyStateConnecting = 0;
const wsReadyStateOpen = 1;
const wsReadyStateClosing = 2; // eslint-disable-line
const wsReadyStateClosed = 3; // eslint-disable-line

const docs: Map<string, WSSharedDoc> = new Map();

// keep track of options used to initialize the connection
// so we can warn user if options change once doc is initialized
const opts: WeakMap<WSSharedDoc, string> = new WeakMap();
const hashOptions = (options: YPartyKitOptions) => {
  return JSON.stringify(options, (_key, value) =>
    // don't compare function implementation, just whether we had one
    typeof value === "function" ? "function() {}" : (value as unknown)
  );
};

// warn user if options change once doc is initialized
let didWarnAboutOptionsChange = false;
const warnIfOptionsChanged = (doc: WSSharedDoc, options: YPartyKitOptions) => {
  if (didWarnAboutOptionsChange) return;
  const prevOpts = opts.get(doc);
  const currOpts = hashOptions(options);
  if (prevOpts !== currOpts) {
    didWarnAboutOptionsChange = true;
    console.warn(
      "Document was previously initialized with different options. Provided options are ignored."
    );
    console.log("Previous options:", prevOpts);
    console.log("Provided options:", currOpts);
  }
};

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

class WSSharedDoc extends YDoc {
  name: string;
  conns: Map<Party.Connection, Set<number>>;
  awareness: awarenessProtocol.Awareness;
  storage: YPartyKitStorage | undefined;
  persist: YPartyKitPersistenceStrategy | undefined;
  persistMaxBytes = MAX_BYTES;
  persistMaxUpdates = MAX_UPDATES;
  gc: boolean;

  constructor(room: Party.Room, options: YPartyKitOptions) {
    super({ gc: options.gc ?? !options.persist });
    this.gc = options.gc ?? !options.persist;
    this.name = room.id;

    if (options.persist) {
      if (options.persist === true) {
        console.warn(
          "y-partykit: Using deprecated option `persist: true`. Choose an explicit persistence strategy instead. See: https://docs.partykit.io/reference/y-partykit-api/#persistence"
        );
        this.persist = {
          mode: "history",
          maxBytes: MAX_BYTES,
          maxUpdates: MAX_UPDATES
        };
      } else if (options.persist?.mode === "history") {
        if ((options.persist.maxBytes ?? 0) > MAX_BYTES) {
          console.warn(
            "y-partykit: `persist.maxBytes` exceeds maximum allowed value 10_000_000 (10MB). Using default value instead. See: https://docs.partykit.io/reference/y-partykit-api/#persistence"
          );
        }

        const { maxBytes, maxUpdates } = options.persist;
        this.persist = {
          mode: "history",
          maxBytes: Math.min(MAX_BYTES, maxBytes || MAX_BYTES),
          maxUpdates: Math.min(MAX_UPDATES, maxUpdates || MAX_UPDATES)
        };
      } else {
        this.persist = options.persist;
      }
    }

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
        removed
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
    // @ts-expect-error - TODO: fix this
    this.on("update", updateHandler);
  }

  async bindState() {
    assert(this.storage, "Storage not set");
    const persistedYdoc = await this.storage.getYDoc(this.name);
    applyUpdate(this, encodeStateAsUpdate(persistedYdoc));
    this.on("update", (update) => {
      assert(this.storage, "Storage not set");
      this.storage.storeUpdate(this.name, update).catch((e) => {
        console.error("Error storing update", e);
      });
    });
  }
  /**
   * Appends the entire document state as an update to the update log.
   */
  async writeState() {
    assert(this.storage, "Storage not set");
    const newUpdates = encodeStateAsUpdate(this);
    await this.storage.storeUpdate(this.name, newUpdates);
  }

  /**
   * Replaces the current update log with the current state of the document.
   */
  async compactUpdateLog() {
    assert(this.storage, "Storage not set");

    await this.storage.compactUpdateLog(
      this.name,
      (this.persist?.mode === "history" && this.persist.maxUpdates) || 0,
      (this.persist?.mode === "history" && this.persist.maxBytes) || 0
    );
  }
}

const CALLBACK_DEFAULTS = {
  debounceWait: 2000,
  debounceMaxWait: 10000,
  timeout: 5000,
  objects: {}
};

function getContent(objName: string, objType: string, doc: YDoc) {
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
      return doc.getXmlElement(objName);
    default:
      return {
        toJSON() {
          throw new Error(`Unknown shared object type: ${objType}`);
        }
      };
  }
}

const getYDocPromises = new Map<string, Promise<WSSharedDoc>>();

/**
 * Gets a Y.Doc by name, whether in memory or on disk
 */
async function getYDoc(
  // docname: string, // the name of the Y.Doc to find or create
  room: Party.Room,
  options: YPartyKitOptions
): Promise<WSSharedDoc> {
  let doc = docs.get(room.id);
  if (doc) {
    // TODO: remove warning once we have a single way to initialize a doc
    warnIfOptionsChanged(doc, options);
    return doc;
  }

  // capture options before applying defaults to ensure we're comparing the right thing
  const hashedOptions = hashOptions(options);

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

  if (options.gc === undefined && options.persist) {
    options.gc = false;
  }

  doc = new WSSharedDoc(room, options);

  const { callback, load } = options;

  // allow caller to provide initial document state
  if (load) {
    const src = await load();
    if (src != null) {
      const state = encodeStateAsUpdate(src);
      applyUpdate(doc, state);
    }
  }

  if (callback !== undefined) {
    doc.on(
      "update",
      debounce(
        async (update: Uint8Array, origin: Party.Connection, doc: YDoc) => {
          if (callback.url) {
            const dataToSend = {
              // @ts-expect-error - TODO: fix this
              room: doc.name,
              data: {}
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
                ).toJSON()
              };
            });

            // POST to the callback URL
            try {
              const res = await fetch(callback.url, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  ...(callback.headers && Object.fromEntries(callback.headers))
                },
                body: JSON.stringify(dataToSend),
                signal: AbortSignal.timeout(
                  callback.timeout || CALLBACK_DEFAULTS.timeout
                )
              });
              if (!res.ok) {
                console.error("failed to persist:", await res.text());
              }
            } catch (err) {
              console.error("failed to persist:", err);
            }
          }

          if (callback.handler) {
            try {
              await callback.handler(doc);
            } catch (err) {
              console.error("failed to persist:", err);
            }
          }
        },
        callback.debounceWait || CALLBACK_DEFAULTS.debounceWait,
        {
          maxWait: callback.debounceMaxWait || CALLBACK_DEFAULTS.debounceMaxWait
        }
      )
    );
  }

  if (doc.persist) {
    await doc.bindState();
  }

  docs.set(room.id, doc);
  opts.set(doc, hashedOptions);

  return doc;
}

function readSyncMessage(
  decoder: decoding.Decoder,
  encoder: encoding.Encoder,
  doc: YDoc,
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
    // @ts-expect-error - TODO: fix this
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
      doc.compactUpdateLog().then(
        () => {
          doc.destroy();
        },
        (err) => {
          // @ts-expect-error - TODO: fix this
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
    conn.send(m);
  } catch (e) {
    closeConn(doc, conn);
  }
}

interface CallbackOptions {
  debounceWait?: number;
  debounceMaxWait?: number;
  timeout?: number;
  objects?: Record<string, string>;
}

// Either handler or url needs to be defined, but not both
// TODO: Add a runtime check for this

interface HandlerCallbackOptions extends CallbackOptions {
  handler: (doc: YDoc) => void | Promise<void>;
  url?: never;
}

interface UrlCallbackOptions extends CallbackOptions {
  handler?: never;
  url: string;
  headers?: Headers;
}

type YPartyKitCallbackOptions = HandlerCallbackOptions | UrlCallbackOptions;

export type YPartyKitPersistenceStrategy =
  | {
      /** Persist document edit history */
      mode: "history";
      /**
       * Maximum number of updates to persist before compressing.
       * If value is not set, the update history length is capped by `maxBytes`.
       **/
      maxUpdates?: number;
      /**
       * Maximum total update size to persist before compressing.
       * The default value, and the largest allowed value is 10MB (10_000_000 bytes).
       **/
      maxBytes?: number;
    }
  | {
      /**
       * Persist document snapshot.
       * Keeps full document history as long as there are connected clients,
       * and compresses changes to a snapshot when last client disconnects.
       **/
      mode: "snapshot";
    };

export type YPartyKitOptions = {
  /**
   * disable gc when using persist!
   * */
  gc?: boolean;

  /**
   * Whether to persist the document to PartyKit room storage.
   *
   * - {mode: "snapshot"} — persist full document snapshot (recommended)
   * - {mode: "history", maxUpdates, maxBytes } — persist document edit history
   * - true — Equivalent to { mode: "history" } (deprecated, use { mode: "history "} instead)
   * - false — Do not persist document or history (default value)
   *
   * See https://docs.partykit.io/reference/y-partykit-api/#persistence
   */
  persist?: YPartyKitPersistenceStrategy | boolean;
  callback?: YPartyKitCallbackOptions;
  load?: () => Promise<YDoc | null>;
  readOnly?: boolean;
};

/**
 * Gets or loads the Y.Doc for given room.
 * @NOTE The options provided must match the options provided to `onConnect`. Once the document is loaded, changes to `options` are ignored.
 */
export const unstable_getYDoc = getYDoc;

export async function onConnect(
  conn: Party.Connection,
  room: Party.Room,
  opts: YPartyKitOptions = {}
) {
  // conn.binaryType = "arraybuffer"; // from y-websocket, breaks in our runtime

  const options = { ...opts };

  // get doc, initialize if it does not exist yet
  if (!getYDocPromises.has(room.id)) {
    getYDocPromises.set(room.id, getYDoc(room, options));
  }
  const doc = await getYDocPromises.get(room.id)!;

  getYDocPromises.delete(room.id);

  doc.conns.set(conn, new Set());
  // listen and reply to events
  conn.addEventListener(
    "message",
    handleChunked((data) => {
      if (typeof data !== "string") {
        return messageListener(
          conn,
          doc,
          new Uint8Array(data),
          options.readOnly ?? false
        );
      } else {
        // silently ignore anything else
      }
    })
  );

  conn.addEventListener("close", () => {
    closeConn(doc, conn);
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
