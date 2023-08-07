import * as Y from "yjs";
import * as encoding from "lib0/encoding";
import * as decoding from "lib0/decoding";

import type { PartyKitStorage } from "partykit/server";

const PREFERRED_TRIM_SIZE = 300;

const BINARY_BITS_32 = 0xffffffff;

type StorageKey = DocumentStateVectorKey | DocumentUpdateKey;

/**
 * Keys are arrays of strings + numbers, so we keep a
 * couple of helpers to encode/decode them.
 */
const keyEncoding = {
  encode(arr: StorageKey) {
    const resultArr = [];
    for (const item of arr) {
      resultArr.push(
        // TODO: This is a bit hacky, but it works
        typeof item === "string" ? `"${item}"` : `${item}`.padStart(9, "0")
      );
    }
    return resultArr.join("#");
  },
  decode(str: string): StorageKey {
    return str
      .split("#")
      .map((el) =>
        el.startsWith('"') ? (JSON.parse(el) as StorageKey) : parseInt(el, 10)
      ) as StorageKey;
  },
};

/**
 * A key + value pair.
 */
type Datum = {
  key: StorageKey;
  value: Uint8Array;
};

/**
 * This helper method returns `null` if the key is not found.
 */
export async function levelGet(
  db: PartyKitStorage,
  key: StorageKey
): Promise<Uint8Array | null> {
  const prefix = keyEncoding.encode(key);

  const res = await db.list<Uint8Array>({
    start: prefix,
    end: `${prefix}#zzzzz`,
  });

  if (res.size === 0) {
    return null;
  }

  // combine all the values into one
  const finalArrayLength = Array.from(res.values()).reduce(
    (acc, val) => acc + val.length,
    0
  );

  const finalArray = new Uint8Array(finalArrayLength);
  let offset = 0;
  for (const val of res.values()) {
    finalArray.set(val, offset);
    offset += val.length;
  }

  return finalArray;
}

/**
 * Set a key + value in storage
 */
export async function levelPut(
  db: PartyKitStorage,
  key: StorageKey,
  val: Uint8Array
): Promise<void> {
  // split the val into 128kb chunks
  const chunks = [];
  for (let i = 0; i < val.length; i += 128 * 1024) {
    chunks.push(val.slice(i, i + 128 * 1024));
  }

  const keyPrefix = keyEncoding.encode(key);
  for (let i = 0; i < chunks.length; i++) {
    await db.put(`${keyPrefix}#${i.toString().padStart(3, "0")}`, chunks[i]);
  }
}

function groupBy<T>(arr: T[], fn: (el: T) => string): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const el of arr) {
    const key = fn(el);
    if (!map.has(key)) {
      map.set(key, []);
    }
    map.get(key)!.push(el);
  }
  return map;
}

/**
 * A "bulkier" implementation of getting keys and/or values.
 */
export async function getLevelBulkData(
  db: PartyKitStorage,
  opts: {
    gte: StorageKey;
    lt: StorageKey;
    keys: boolean;
    values: boolean;
    reverse?: boolean;
    limit?: number;
  }
): Promise<Datum[]> {
  const res = await db.list<Uint8Array>({
    start: keyEncoding.encode(opts.gte),
    end: keyEncoding.encode(opts.lt),
    reverse: opts.reverse,
    limit: opts.limit,
  });

  const grouped = groupBy(Array.from(res.entries()), ([key]) =>
    key.split("#").slice(0, -1).join("#")
  );

  const result = [];
  for (const [key, values] of grouped.entries()) {
    const finalArrayLength = values.reduce(
      (acc, val) => acc + val[1].length,
      0
    );

    const finalArray = new Uint8Array(finalArrayLength);
    let offset = 0;
    for (const [, val] of values) {
      finalArray.set(val, offset);
      offset += val.length;
    }

    result.push({
      key: keyEncoding.decode(key),
      value: finalArray,
    });
  }

  return result;
}

/**
 * Get all document updates for a specific document.
 */
async function getLevelUpdates(
  db: PartyKitStorage,
  docName: string,
  opts: {
    values: boolean;
    keys: boolean;
    reverse?: boolean;
    limit?: number;
  } = {
    values: true,
    keys: false,
  }
): Promise<Array<Datum>> {
  return getLevelBulkData(db, {
    gte: createDocumentUpdateKey(docName, 0),
    lt: createDocumentUpdateKey(docName, BINARY_BITS_32),
    ...opts,
  });
}

/**
 * Get the current document 'clock' / counter
 */
async function getCurrentUpdateClock(
  db: PartyKitStorage,
  docName: string
): Promise<number> {
  return getLevelUpdates(db, docName, {
    keys: true,
    values: false,
    reverse: true,
    limit: 1,
  }).then((datums) => {
    if (datums.length === 0) {
      return -1;
    } else {
      const ret = datums[0].key[3];
      if (typeof ret !== "number") {
        throw new Error("Expected number, got " + typeof ret);
      }
      return ret;
    }
  });
}

export async function clearRange(
  db: PartyKitStorage,
  gte: StorageKey, // Greater than or equal
  lt: StorageKey // lower than (not equal)
): Promise<void> {
  const datums = await getLevelBulkData(db, {
    values: false,
    keys: true,
    gte,
    lt,
  });

  // We delete in batches of 128
  const arr = [];
  for (const [index, datum] of datums.entries()) {
    arr.push(keyEncoding.encode(datum.key));
    if (arr.length === 128 || index === datums.length - 1) {
      await db.delete(arr);
      arr.length = 0;
    }
  }
}

async function clearUpdatesRange(
  db: PartyKitStorage,
  docName: string,
  from: number, // Greater than or equal
  to: number // lower than (not equal)
): Promise<void> {
  return clearRange(
    db,
    createDocumentUpdateKey(docName, from),
    createDocumentUpdateKey(docName, to)
  );
}

/**
 * Create a unique key for a update message.
 * We encode the result using `keyEncoding` which expects an array.
 */
type DocumentUpdateKey = ["v1", string, "update", number];
type DocumentStateVectorKey = ["v1_sv", string];

function createDocumentUpdateKey(
  docName: string,
  clock: number
): DocumentUpdateKey {
  return ["v1", docName, "update", clock];
}

/**
 * @param {string} docName
 * @param {string} metaKey
 */
// const createDocumentMetaKey = (docName: string, metaKey: string) => [
//   "v1",
//   docName,
//   "meta",
//   metaKey,
// ];

/**
 * @param {string} docName
 */
// const createDocumentMetaEndKey = (docName: string) => ["v1", docName, "metb"]; // simple trick

/**
 * We have a separate state vector key so we can iterate efficiently over all documents
 * (This might make more sense for level db style databases, but not so much for DOs)
 * @param {string} docName
 */
function createDocumentStateVectorKey(docName: string): DocumentStateVectorKey {
  return ["v1_sv", docName];
}

/**
 * @param {string} docName
 */
// const createDocumentFirstKey = (docName: string) => ["v1", docName];

/**
 * We use this key as the upper limit of all keys that can be written.
 * Make sure that all document keys are smaller! Strings are encoded using varLength string encoding,
 * so we need to make sure that this key has the biggest size!
 *
 * @param {string} docName
 */
// const createDocumentLastKey = (docName: string) => ["v1", docName, "zzzzzzz"];

// const emptyStateVector = (() => Y.encodeStateVector(new Y.Doc()))()

/**
 * For now this is a helper method that creates a Y.Doc and then re-encodes a document update.
 * In the future this will be handled by Yjs without creating a Y.Doc (constant memory consumption).
 *
 */
function mergeUpdates(updates: Array<Uint8Array>): {
  update: Uint8Array;
  sv: Uint8Array;
} {
  const ydoc = new Y.Doc();
  ydoc.transact(() => {
    for (let i = 0; i < updates.length; i++) {
      Y.applyUpdate(ydoc, updates[i]);
    }
  });
  return { update: Y.encodeStateAsUpdate(ydoc), sv: Y.encodeStateVector(ydoc) };
}

async function writeStateVector(
  db: PartyKitStorage,
  docName: string,
  sv: Uint8Array, // state vector
  clock: number // current clock of the document so we can determine when this statevector was created
) {
  const encoder = encoding.createEncoder();
  encoding.writeVarUint(encoder, clock);
  encoding.writeVarUint8Array(encoder, sv);
  await levelPut(
    db,
    createDocumentStateVectorKey(docName),
    encoding.toUint8Array(encoder)
  );
}

function decodeLeveldbStateVector(buf: Uint8Array): {
  sv: Uint8Array;
  clock: number;
} {
  const decoder = decoding.createDecoder(buf);
  const clock = decoding.readVarUint(decoder);
  const sv = decoding.readVarUint8Array(decoder);
  return { sv, clock };
}

async function readStateVector(db: PartyKitStorage, docName: string) {
  const buf = await levelGet(db, createDocumentStateVectorKey(docName));
  if (buf === null) {
    // no state vector created yet or no document exists
    return { sv: null, clock: -1 };
  }
  return decodeLeveldbStateVector(buf);
}

async function flushDocument(
  db: PartyKitStorage,
  docName: string,
  stateAsUpdate: Uint8Array,
  stateVector: Uint8Array
): Promise<number> /* returns the clock of the flushed doc */ {
  const clock = await storeUpdate(db, docName, stateAsUpdate);
  await writeStateVector(db, docName, stateVector, clock);
  await clearUpdatesRange(db, docName, 0, clock); // intentionally not waiting for the promise to resolve!
  return clock;
}

async function storeUpdate(
  db: PartyKitStorage,
  docName: string,
  update: Uint8Array
): Promise<number> /* Returns the clock of the stored update */ {
  const clock = await getCurrentUpdateClock(db, docName);
  if (clock === -1) {
    // make sure that a state vector is aways written, so we can search for available documents
    const ydoc = new Y.Doc();
    Y.applyUpdate(ydoc, update);
    const sv = Y.encodeStateVector(ydoc);
    await writeStateVector(db, docName, sv, 0);
  }
  await levelPut(db, createDocumentUpdateKey(docName, clock + 1), update);
  return clock + 1;
}

export class YPartyKitStorage {
  db: PartyKitStorage;
  tr: Promise<unknown>;
  _transact<T>(f: (arg0: PartyKitStorage) => Promise<T>): Promise<T>;
  _transact<T>(fn: (arg0: PartyKitStorage) => Promise<T>) {
    // Implemented in constructor
    throw Error("implement _transact");
    return fn(this.db);
  }
  constructor(storage: PartyKitStorage) {
    const db = (this.db = storage);
    this.tr = Promise.resolve();
    /**
     * Execute an transaction on a database. This will ensure that other processes are currently not writing.
     *
     * This is a private method and might change in the future.
     *
     * @todo only transact on the same room-name. Allow for concurrency of different rooms.
     *
     * @template T
     *
     * @param {function(any):Promise<T>} f A transaction that receives the db object
     * @return {Promise<T>}
     */
    this._transact = <T>(
      f: (db: PartyKitStorage) => Promise<T>
    ): Promise<T> => {
      const currTr = this.tr;
      this.tr = (async () => {
        await currTr;
        let res = /** @type {any} */ null;
        try {
          res = await f(db);
        } catch (err) {
          console.warn("Error during y-partykit-storage transaction", err);
        }
        return res;
      })();
      return this.tr as Promise<T>;
    };
  }

  async flushDocument(docName: string): Promise<void> {
    return this._transact(async (db) => {
      const updates = await getLevelUpdates(db, docName);
      const { update, sv } = mergeUpdates(updates.map((u) => u.value));
      await flushDocument(db, docName, update, sv);
    });
  }

  async getYDoc(docName: string): Promise<Y.Doc> {
    return this._transact(async (db) => {
      const updates = await getLevelUpdates(db, docName);
      const ydoc = new Y.Doc();
      ydoc.transact(() => {
        for (let i = 0; i < updates.length; i++) {
          Y.applyUpdate(ydoc, updates[i].value);
        }
      });
      if (updates.length > PREFERRED_TRIM_SIZE) {
        await flushDocument(
          db,
          docName,
          Y.encodeStateAsUpdate(ydoc),
          Y.encodeStateVector(ydoc)
        );
      }
      return ydoc;
    });
  }

  async getStateVector(docName: string): Promise<Uint8Array> {
    return this._transact(async (db) => {
      const { clock, sv } = await readStateVector(db, docName);
      let curClock = -1;
      if (sv !== null) {
        curClock = await getCurrentUpdateClock(db, docName);
      }
      if (sv !== null && clock === curClock) {
        return sv;
      } else {
        // current state vector is outdated
        const updates = await getLevelUpdates(db, docName);
        const { update, sv } = mergeUpdates(updates.map((u) => u.value));
        await flushDocument(db, docName, update, sv);
        return sv;
      }
    });
  }

  async storeUpdate(
    docName: string,
    update: Uint8Array
  ): Promise<number> /* Returns the clock of the stored update */ {
    return this._transact((db) => storeUpdate(db, docName, update));
  }
}
