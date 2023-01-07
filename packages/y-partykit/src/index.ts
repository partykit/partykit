import {
  Y,
  syncProtocol,
  awarenessProtocol,
  encoding,
  decoding,
  map,
} from "../vendor/ylibs";

import debounce from "lodash.debounce";
import type { PartyKitRoom } from "partykit/server";

const wsReadyStateConnecting = 0;
const wsReadyStateOpen = 1;
const wsReadyStateClosing = 2; // eslint-disable-line
const wsReadyStateClosed = 3; // eslint-disable-line

type Persistence = {
  bindState: (arg0: string, arg1: WSSharedDoc) => void;
  writeState: (arg0: string, arg1: WSSharedDoc) => Promise<void>;
};

// const persistenceDir = process.env.YPERSISTENCE;

// const persistence: Persistence = null;
// if (typeof persistenceDir === 'string') {
//   console.info('Persisting documents to "' + persistenceDir + '"')
//   // @ts-ignore
//   const LeveldbPersistence = require('y-leveldb').LeveldbPersistence
//   const ldb = new LeveldbPersistence(persistenceDir)
//   persistence = {
//     provider: ldb,
//     bindState: async (docName, ydoc) => {
//       const persistedYdoc = await ldb.getYDoc(docName)
//       const newUpdates = Y.encodeStateAsUpdate(ydoc)
//       ldb.storeUpdate(docName, newUpdates)
//       Y.applyUpdate(ydoc, Y.encodeStateAsUpdate(persistedYdoc))
//       ydoc.on('update', update => {
//         ldb.storeUpdate(docName, update)
//       })
//     },
//     writeState: async (docName, ydoc) => {}
//   }
// }

// export function setPersistence(persistence_: Persistence) {
//   persistence = persistence_;
// }

// export function getPersistence(): Persistence {
//   return persistence;
// }

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
  persistence: Persistence | undefined;

  constructor(name: string, options: YPartyKitOptions) {
    super({ gc: options.gc || false });
    this.name = name;
    this.persistence = options.persistence;
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
  docname: string, // the name of the Y.Doc to find or create
  options: YPartyKitOptions
): WSSharedDoc {
  return map.setIfUndefined(docs, docname, () => {
    const { callback } = options;
    const doc = new WSSharedDoc(docname, options);
    doc.gc = options.gc || false; // TODO: is this necessary?
    if (callback !== undefined) {
      doc.on(
        "update",
        debounce(
          (update: Uint8Array, origin: WebSocket, doc: WSSharedDoc) => {
            const room = doc.name;
            const dataToSend = {
              room,
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
              console.error("failed to persisr", err);
            });
          },
          callback.debounceWait || CALLBACK_DEFAULTS.debounceWait,
          {
            maxWait:
              callback.debounceMaxWait || CALLBACK_DEFAULTS.debounceMaxWait,
          }
        )
      );
    }

    doc.persistence?.bindState(docname, doc);
    docs.set(docname, doc);
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
    if (doc.conns.size === 0 && doc.persistence !== undefined) {
      // if persisted, we store state and destroy ydocument
      doc.persistence.writeState(doc.name, doc).then(
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

export type YPartyKitOptions = {
  // room: PartyKitRoom;
  /**
   * disable gc when using snapshots!
   * */
  gc?: boolean;
  persistence?: Persistence;
  callback?: {
    url: string;
    debounceWait?: number;
    debounceMaxWait?: number;
    timeout?: number;
    objects?: Record<string, string>;
  };
};

export function onConnect(
  conn: WebSocket,
  room: PartyKitRoom,
  options: YPartyKitOptions = {}
) {
  // conn.binaryType = "arraybuffer"; // from y-websocket, breaks in our runtime

  // get doc, initialize if it does not exist yet
  const doc = getYDoc(room.id, options);
  doc.conns.set(conn, new Set());
  // listen and reply to events
  conn.addEventListener("message", (message) => {
    if (typeof message.data !== "string") {
      return messageListener(conn, doc, new Uint8Array(message.data));
    } else if (message.data === "pong") {
      console.warn("Received non-binary message:", message.data);
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
