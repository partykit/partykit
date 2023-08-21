### y-partykit

`y-partykit` is an addon library for `partykit` designed to host backends for [Yjs](https://yjs.dev), a high-performance library of data structures for building collaborative software. You can set up a Yjs backend with just a few lines of code:

```ts
// server.ts
import { onConnect } from "y-partykit";

export default {
  async onConnect(conn, room, context) {
    return onConnect(conn, room);
  },
};
```

You can pass additional options for more complex backends:

```ts
// server.ts
import { onConnect } from "y-partykit";

export default {
  async onConnect(conn, room, context) {
    return await onConnect(conn, room, {
      // experiemental: persist the document to partykit's room storage
      persist: true,

      // Or, you can load/save to your own database or storage
      load() {
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
        timeout: 5000, // default: 5000 ms
      },
    });
  },
};
```

Then, use the provider to connect to this server from your client:

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

```ts
// ...
const provider = new YPartyKitProvider(
  "localhost:1999",
  "my-document-name",
  yDoc,
  {
    connect: false, // don't connect immediately, use provider.connect() when required
    params: { token: "my-secre-token" }, // adds to the query string of the websocket connection
    awareness: new awarenessProtocol.Awareness(yDoc), // use your own Yjs awareness instance
  }
);
```

Refer to the [official Yjs documentation](https://docs.yjs.dev/ecosystem/editor-bindings) for more information. Examples provided in the Yjs documentation should work seamlessly with `y-partykit` (ensure to replace `y-websocket` with `y-partykit/provider`).
