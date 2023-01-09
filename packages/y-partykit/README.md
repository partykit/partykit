## y-partykit

[Yjs](https://yjs.dev) is a library of data structures for building collaborative applications. `y-partykit` is a library that makes it easy to host backends for [Yjs](https://yjs.dev) on partykit. You can create a yjs backend with as little code as this:

```ts
// server.ts
import { onConnect } from "y-partykit";

export default { onConnect };
```

Then, you can use the provider to connect to this server:

```ts
import YPartyKitProvider from "y-partykit/provider";

const provider = new YPartyKitProvider("localhost:1999", "my-room", doc);
```
