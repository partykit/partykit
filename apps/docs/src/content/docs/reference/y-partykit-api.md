---
title: Y-PartyKit (Yjs API)
description: Y-PartyKit is an addon library designed to host backends for Yjs
sidebar:
  order: 5
---

`y-partykit` is an addon library for `partykit` designed to host backends for [Yjs](https://yjs.dev), a high-performance library of data structures for building collaborative software.

## Setting up a Yjs Server

Using `y-partykit` simplifies setting up a Yjs backend. Only a few lines of code are needed:

```ts
// server.ts
import type * as Party from "partykit/server";
import { onConnect } from "y-partykit";

export default class YjsServer implements Party.Server {
  constructor(public party: Party.Room) {}
  onConnect(conn: Party.Connection) {
    return onConnect(conn, this.party, {
      // ...options
    });
  }
}
```

See [Server Configuration](#server-configuration) for configuration options.

## Connecting from the client

Use the provider to connect to this server from your client:

```ts
import YPartyKitProvider from "y-partykit/provider";
import * as Y from "yjs";

const yDoc = new Y.Doc();

const provider = new YPartyKitProvider(
  "localhost:1999",
  "my-document-name",
  yDoc
);
```

You can add additional options to the provider:

```tsx

// ...
const getAuthToken = () => { /* ... */ };
const provider = new YPartyKitProvider(
  "localhost:1999",
  "my-document-name",
  yDoc,
  {
    connect: false, // do not connect immediately, use provider.connect() when required
    awareness: new awarenessProtocol.Awareness(yDoc), // use your own Yjs awareness instance
    // adds to the query string of the websocket connection, useful for e.g. auth tokens
    params: async () => ({
      token: await getAuthToken()
    });
  }
);
```

## Usage with React

If you're using React, then you can use the hook version of the provider: `useYProvider`.

```ts
import useYProvider from "y-partykit/react";

function App() {
  const provider = useYProvider({
    host: "localhost:1999", // optional, defaults to window.location.host
    room: "my-document-name",
    doc: yDoc, // optional!
    options
  });
}
```

## Server Configuration

For more complex backends, you can pass additional options.

```ts
// server.ts
import type * as Party from "partykit/server";
import { onConnect } from "y-partykit";

export default class YjsServer implements Party.Server {
  constructor(public room: Party.Room) {}
  onConnect(conn: Party.Connection) {
    return onConnect(conn, this.room, {
      // experimental: persists the document to partykit's room storage
      persist: { mode: "snapshot" },

      // enable read only access to true to disable editing, default: false
      readOnly: true,

      // Or, you can load/save to your own database or storage
      async load() {
        // load a document from a database, or some remote resource
        // and return a Y.Doc instance here (or null if no document exists)
      },

      callback: {
        async handler(yDoc) {
          // called every few seconds after edits
          // you can use this to write to a database
          // or some external storage
        },
        // control how often handler is called with these options
        debounceWait: 10000, // default: 2000 ms
        debounceMaxWait: 20000, // default: 10000 ms
        timeout: 5000 // default: 5000 ms
      }
    });
  }
}
```

### Persistence

By default, PartyKit maintains a copy of the Yjs document as long as at least one client is connected to the server. When all clients disconnect, the document state may be lost.

To persists the Yjs document state between sessions, you can use the built-in PartyKit storage by enabling the `persist` option.

`y-partykit` supports two modes of persistence: **snapshot**, and **history**.

#### Persisting snapshots (recommended)

In `snapshot` mode, PartyKit stores the latest document state between sessions.

```ts
onConnect(connection, party, {
  persist: {
    mode: "snapshot"
  }
});
```

During a session, PartyKit accumulates individual updates and stores them as separate records. When an editing session ends due to last connection disconnecting, PartyKit merges all updates to a single snapshot.

The `snapshot` mode is optimal for most applications that do not need to support long-lived offline editing sessions.

#### Persisting update history (advanced)

In `history` mode, PartyKit stores the full edit history of the document.

This is useful when multiple clients are expected to be able to change the document while offline, and synchronise their changes later.

```ts
onConnect(connection, party, {
  persist: {
    mode: "history"
  }
});
```

For long-lived documents, the edit history would grow indefinitely, eventually reaching the practical limits of a single PartyKit server instance.

To prevent unbounded growth, PartyKit applies a 10MB maximum limit to the edit history. You can customise these limits as follows:

```ts
onConnect(connection, party, {
  persist: {
    mode: "history",
    // Maximum size in bytes.
    // You can set this value to any number below 10MB (10_000_000 bytes).
    maxBytes: 10_000_000,

    // Maximum number of updates.
    // By default, there is no maximum, and history grows until maximum amount of bytes is reached.
    maxUpdates: 10_000
  }
});
```

Once either limit is reached, the document is snapshotted, and history tracking is started again.

#### `persist: true` (deprecated)

In previous versions, PartyKit only had one persistence mode:

```ts
onConnect(connection, party, { persist: true });
```

This is functionally equivalent to setting the value to `{ mode: "history" }`.

This option is still supported for backwards compatibility reasons, but will be removed in a future version of `y-partykit`.

#### Persisting to an external service

You can use a combination of the `load` and `callback` options to synchronise the document to an external service:

```ts
return onConnect(conn, this.party, {
  async load() {
    return await fetchDataFromExternalService();
  },

  callback: {
    async handler(yDoc) {
      return sendDataToExternalService(yDoc);
    },
    // only save after every 2 seconds (default)
    debounceWait: 2000,
    // if updates keep coming, save at least once every 10 seconds (default)
    debounceMaxWait: 10000,
  },
});
```

The `load` callback is called on first connection to the server instance. Once the document has been loaded, it's kept in memory until the session ends.

## Learn more

For more information, refer to the [official Yjs documentation](https://docs.yjs.dev/ecosystem/editor-bindings). Examples provided in the Yjs documentation should work seamlessly with `y-partykit` (ensure to replace `y-websocket` with `y-partykit/provider`).

---

Questions? Ideas? We'd love to hear from you 🎈 Reach out to us on [Discord](https://discord.gg/KDZb7J4uxJ) or [Twitter](https://twitter.com/partykit_io)!
