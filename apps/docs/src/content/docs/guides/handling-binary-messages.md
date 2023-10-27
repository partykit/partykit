---
title: Handling binary messages
description: Send raw binary data over the wire
sidebar:
    badge: New
---

Most PartyKit examples you see will assume WebSocket messages are strings, and more specifically, JSON strings:

```ts
onMessage(message: string) {
  const data = JSON.parse(message);
}
```

Similarly, we often see the server responding with stringified JSON:

```ts
onConnect(connection: Party.Connection) {
  this.party.broadcast(JSON.stringify({ type: "join", id: connection.id }));
}
```

These examples are simplified, because in reality, both incoming and outcoming messages can be either strings, or generic raw binary data buffers:

```ts
onMessage(message: string | ArrayBufferLike) {
  if (typeof message !== string) {
    this.party.broadcast(message);
  }
}
```

:::note[ArrayBufferLike... like what?]
The type `ArrayBufferLike` is a TypeScript name for any object implements the `ArrayBuffer` interface, usually either [`ArrayBuffer`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer) or [`SharedArrayBuffer`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/SharedArrayBuffer).

Read [Lin Clark's cartoon guide](https://hacks.mozilla.org/2017/06/a-cartoon-intro-to-arraybuffers-and-sharedarraybuffers/) for more information.
:::

## Why ArrayBuffers?

Strings are convenient, but they are not a good format for representing non-textual data, such as images, video, WASM bundles, and so on. In fact, often in JavaScript programs we [`Base64` encode](https://developer.mozilla.org/en-US/docs/Glossary/Base64) binary data in order to coerce it into a string, which is both slow and consumes a lot of memory and network bandwidth.

Even when handling text data, strings can be inefficient. These days, most web servers compress HTTP responses using compression algorithms like `gzip`, but WebSocket messages aren't compressed by default. So if you are sending over large amounts of textual data (for example large JSON structures), you may be wasting a lot of bytes.

ArrayBuffers allow you to represent data as low-level arrays of binary data: `0`s and `1`s. This gives you the flexibility to send any data you'd like, and represent, encode, and compress it in any format you want.


## Binary encoding JavaScript objects using MessagePack

When it comes to encoding your data in a binary format, there is no one-size-fits-all approach. Depending on the shape of your data, you will find different binary encodings provide different benefits and tradeoffs.

In this example, we'll use the [MessagePack](https://msgpack.org/) format and the [`msgpackr`](https://www.npmjs.com/package/msgpackr) library to pack (encode) and unpack (decode) our objects to a binary format.

### Encoding and decoding binary data on the server

At its simplest, MessagePack is a drop-in replacement for JSON:

```ts
import { unpack, pack } from 'msgpackr';

class Server implements Party.Server {
  onConnect(connection: Party.Connection) {
    const data = { type: "join", id: connection.id };
//  const message = JSON.stringfy(data);
    const message = pack(data);
    this.party.broadcast(message);
  }

  onMessage(message: string | ArrayBufferLike) {
//  if (typeof message === string) {
    if (typeof message !== string) {
//   const data = JSON.parse(message);
     const data = unpack(message);
    }
  }
}
```

### Decoding binary data on the client

On the client, you can also use the same library to unpack server responses:

```ts
import { unpack } from 'msgpackr/unpack';

socket.addEventListener((event) => {
//const message = JSON.parse(event.data);
  const message = unpack(event.data);
});
```

### Measure before you pack

MessagePack is easy to use, but it doesn't necessarily make it a good idea. 

We chose the `msgpackr` implementation for this guide because it's fast, but because `JSON.parse` and `JSON.stringify` are built natively into the JavaScript runtime, they are very fast too, so you may not realise the type of performance gains you want.

Additionally, if you use the `msgpackr` library on the client size, you are adding nearly 10 kB of code to you JavaScript bundle.

Choosing to use a binary encodng is a tradeoff, but typically, generic binary encodings make sense when you are sending in large data payloads, and may not make sense for smaller messages.

### Mix both JSON and MessagePack encodings

Because you are in full control of the server and client, you can make assumptions about the data encoding based on the `message` format.

You could for example assume, that when a message is of type `string`, it's going to be JSON, and when it's a binary blob, it's encoded with MessagePack:

```ts
onMessage(message: string | ArrayBuffer) {
  const data =
    typeof message !== string
      ? // byte array -> msgpack
      unpack(message)
      : // string -> json
      JSON.parse(event.data);
}

```

And do the same on the client:
```ts
socket.addEventListener((event) => {
  const data =
    event.data instanceof Blob
      ? // byte array -> msgpack
      unpack(await event.data.arrayBuffer())
      : // string -> json
      JSON.parse(event.data);
}
```

With this approach, you can use MessagePack for large messages, such as syncing over large sets of data at once, while still use JSON for smaller messages.

## Validating binary data

Encoding libraries like MessagePack will usually validate that the data conforms to a format, but are agnostic to the _content_ of the message.

To learn about validating data against a schema, read our [Validating client inputs](/guides/validating-client-inputs) guide.
