---
title: Validating client inputs
description: Make sure you only accept well-formed data from the clients
---

PartyKit is flexible, when it comes to data it accepts. You can send arbitrary strings or binary data over WebSockets or in HTTP request bodies to your PartyKit server.

This is handy, but sometimes it may result in receiving unexpected data.

## Data schemas

The most ergonomic way to ensure the data you receive is what you expect, is to check it against a _schema_. There are many great TypeScript libraries for validating input, such as [typescript-json-schema](https://github.com/YousefED/typescript-json-schema), [io-ts](https://github.com/gcanti/io-ts), [yup](https://github.com/jquense/yup), and [zod](https://github.com/colinhacks/zod).

In this guide, we'll use [`zod`](https://github.com/colinhacks/zod).

### Defining a data schema

`zod` allows you to define expected message types using a declarative schema language:

```ts
import z from "zod";

const AddMessage = z.object({
  type: z.literal("add"),
  id: z.string(),
  item: z.string()
});
const RemoveMessage = z.object({ type: z.literal("remove"), id: z.number() });
const Message = z.union([AddMessage, RemoveMessage]);
```

In the above example, the `Message` schema can be used to validate all allowed message shapes.

## Validating WebSocket messages

Once you specified the schema, you can validate inputs in a type-safe way. In the below example, if the incoming `message` does not conform to the `Message` schema, the message is ignored:

```ts

onMessage(message: string) {
  // parse the message, or throw an error if the message is invalid
  const result = Message.safeParse(JSON.parse(message));
  if (result.success === true) {
    const data = result.data;
    switch (data.type) {
      case "add":
        // do something
        break;
      case "remove":
        // do something
        break;
    }
  }
}
```

In addition to runtime validation, `zod` uses TypeScript type inference to add an additional layer of type safety to your program, so in the above `switch` statement, each type of message is typed based on its schema like below:

```ts
case "remove":
  // @ts-expect-error RemoveMessage does not have `item`
  data.item;
  break;
```

## Validating HTTP requests

You can use the same schema to validate HTTP request payloads:

```ts
await onRequest(req: Party.Request) {
  const body = await req.json();
  const result = Message.safeParse(body);
  if (result.success) {
    // do something
  } else {
    return new Response(result.error.message, { status: 400 });
  }
}
```

## Validating responses on the client

Because `zod` works in any standard JavaScript environment, we can use the same library on the client side to validate that the server-sent responses are valid.

Define a schema in a shared file, for example in `schema.ts`:

```ts
import z from "zod";

export const ReplyMessage = z.object({ type: z.literal("join"), id: z.string() });
```

You can then validate incoming messages on the client:

```ts
socket.addEventListener((event) => {
  const result = ReplyMessage.safeParse(JSON.parse(event.data));
  if (result.success) {
    if (result.data.type === "join") {
      console.log(result.data.id);
    }
  }
});
```

If you want to ensure that the server can never accidentally send a response that doesn't conform to the schema, you can optionally also validate the response data before you send or broadcast it:

```ts
onConnect(connection: Party.Connection) {
  const message = ReplyMessage.parse({ type: "join", id: connection.id });
  this.room.broadcast(JSON.stringify(message));
}
```

## Validating binary messages

The above examples assume that the WebSocket messages are JSON strings. However, PartyKit supports [sending raw binary data](./guides/handling-binary-messages/) as well.

`zod` is agnostic to the data serialization and encoding formats. In all above examples, we have first called `JSON.parse` to parse the data to plain JavaScript objects before validating the format.

The same `zod` validation approach will work for binary data, as long as you have a way of decoding the raw `Uint8Array` into objects:

```ts
onMessage(message: string | ArrayBufferLike) {
  if (typeof message !== "string") {
    const result = ReplyMessage.safeParse(decodeBinaryData(message));
    if (result.success) {
      // ...
    }
  }
}
```

For more information about binary encodings, read our [Handling binary messages](/guides/handling-binary-messages) guide.
