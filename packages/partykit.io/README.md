## partykit.io: Websockets made simple.

This library simplifies a lot of common usage patterns around Websockets, inspired by [socket.io](https://socket.io).

## Usage

```ts
// server.ts

import { PartyHost } from "partykit.io/server";

const host = new PartyHost({
  /* options */
})
  .onSend("hello", (arg1) => {
    // ...
  })
  .onGet("hello", async (arg1) => {
    // ...return some value
  })
  .onSubscribe("hello", (arg1) => {
    // ...return an async iterator?
  });

export default {
  onConnect(ws, room) {
    host.connect(ws, room);
  },
};
```

and on the client

```ts
// client.ts

import { Party } from "partykit.io/client";

const party = new Party({
  host: "localhost:1999",
});

const socket = party.join("some-room");

socket.send("hello", "world");

const result = socket.get("hello", "world");

const unsubscribe = socket.subscribe("hello", "world", (evt) => {
  // ...
});
```
