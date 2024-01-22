// import { AsyncLocalStorage } from "node:async_hooks";

// const asyncLocalStorage = new AsyncLocalStorage();

import { createSessionStorage } from "./implementations";

import type {
  SessionData,
  SessionIdStorageStrategy,
  SessionStorage
} from "@remix-run/server-runtime";

interface PartyStorage {
  get(id: string): Promise<string | null>;
  put(
    id: string,
    data: string,
    options?: { expiration?: number }
  ): Promise<void>;
  delete(id: string): Promise<void>;
}

interface PartySessionStorageOptions {
  /**
   * The Cookie used to store the session id on the client, or options used
   * to automatically create one.
   */
  cookie?: SessionIdStorageStrategy["cookie"];

  /**
   * The Party used to store the sessions.
   */
  party: PartyStorage;
}

/**
 * Creates a SessionStorage that stores session data in the Clouldflare KV Store.
 *
 * The advantage of using this instead of cookie session storage is that
 * KV Store may contain much more data than cookies.
 */
export function createPartySessionStorage<
  Data = SessionData,
  FlashData = Data
>({
  cookie,
  party
}: PartySessionStorageOptions): SessionStorage<Data, FlashData> {
  return createSessionStorage({
    cookie,
    async createData(data, expires) {
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const randomBytes = new Uint8Array(8);
        crypto.getRandomValues(randomBytes);
        // This storage manages an id space of 2^64 ids, which is far greater
        // than the maximum number of files allowed on an NTFS or ext4 volume
        // (2^32). However, the larger id space should help to avoid collisions
        // with existing ids when creating new sessions, which speeds things up.
        const id = [...randomBytes]
          .map((x) => x.toString(16).padStart(2, "0"))
          .join("");

        if (await party.get(id)) {
          continue;
        }

        await party.put(id, JSON.stringify(data), {
          expiration: expires ? Math.round(expires.getTime() / 1000) : undefined
        });

        return id;
      }
    },
    async readData(id) {
      const session = await party.get(id);

      if (!session) {
        return null;
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return JSON.parse(session);
    },
    async updateData(id, data, expires) {
      await party.put(id, JSON.stringify(data), {
        expiration: expires ? Math.round(expires.getTime() / 1000) : undefined
      });
    },
    async deleteData(id) {
      await party.delete(id);
    }
  });
}
