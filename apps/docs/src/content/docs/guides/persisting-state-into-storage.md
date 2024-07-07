---
title: Persisting state into storage
description: Each PartyKit room comes with a transactional key-value Storage API
---

Each PartyKit room comes with a transactional key-value Storage API to persist data. This page provides an overview on what Storage API is, its data format, and programming.

## Keeping data between server restarts

Persisting data to disk is optional as PartyKit servers also allow you to keep in-memory state. It is, however, necessary, when you want the stored data to persist between server restarts.

Server restarts happen when:

- You re-deploy the project using `partykit deploy`.
- Having opted into [Hibernation](/guides/scaling-partykit-servers-with-hibernation/), the server is currently not processing messages.
- There's an unexpected error in the PartyKit runtime (for example, a hardware fault).
- The server reaches its maximum lifetime.

If you want to guarantee that your party state is not lost between server restarts, you'll need to save the state somewhere and reload it when your party starts up again.

You can store your state in a third-party edge-compatible database such as PlanetScale or Supabase, or send it to an arbitrary API endpoint of your choice. The most convenient storage option is to use [`Room.storage`](/reference/partyserver-api/#roomstorage/).

## Data format

You can store most types of data without having to serialize them to JSON.

Please note that:

- The key must be a string with a maximum size of 2,048 bytes.
- The value can be any type supported by the [structured clone algorithm](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm), limited to 128 KiB (131,072 bytes) per value.

## Usage

### Reading data

```ts
const data = await this.room.storage.get<OptionalTypeDefinition>("key");
```

### Writing data

```ts
await this.room.storage.put("key", value);
```

### Deleting data

```ts
await this.room.storage.delete("key");
```

### Listing items

`list()` returns a map of all items in storage.

```ts
const items = await this.room.storage.list();
for (const [key, value] of items) {
  console.log(key, value);
}
```

:::caution[Can you use get() instead?]
You should only use this operation when you **need to iterate through all of the items in storage**. It may be a memory-heavy activity. If you don't need to access all the items, use [`get`](#reading-data).
:::

If you only need access to the keys, you can do this:

```ts
const keys = [...(await this.room.storage.list()).keys()];
```

## Storing large amounts of data

There is no practical limit to how many keys each Party can store, so with thoughtful data model design, you can store large amounts of data in a Party by sharding across multiple keys.

```ts
type AllItems = Record<string, any>;

export default class Server implements Party.Server {
  options: Party.ServerOptions = { hibernate: true };
  constructor(readonly room: Party.Room) {}

  async onMessage(websocketMessage: string) {
    const event = JSON.parse(websocketMessage);
    if (event.type === "create") {
      this.room.broadcast(event.data);
      // store each item under a separate key
      this.room.storage.put(`item:${event.id}`, event.data);
    }

    if (event.type === "update") {
      const item = (await this.room.storage.get(`item:${event.id}`)) ?? {};
      const updatedItem = {
        ...item,
        ...event.data
      };

      this.room.storage.put(`item:${event.id}`, updatedItem);
    }
  }
}
```

In the above example we were able to shard the data across multiple keys. However, if an individual value were to exceed 128KiB limit, you would need to implement an additional sharding strategy to split the value across multiple keys -- see [an example in the `y-partykit` storage adapter](https://github.com/partykit/partykit/blob/7f307216f33dbef8fb61963cac7ce88ce8e8f769/packages/y-partykit/src/storage.ts#L79C1-L97C2).

:::caution[Thoughtful read-patterns]
Given that each room has a total of 128MiB RAM, we recommend thoughtful data read-patterns, which includes not reading vast amounts of data to memory when loading from `storage`.
:::

## Data access patterns

Storage API will work better with certain programming patterns.

### Read data up front in `onStart`

A common pattern is to read the data from storage into memory when the server starts. This way, the data is accessible in a convenient format.

This pattern is especially helpful when your app features **frequent reads and infrequent writes** or when you need to **join multiple data sets to create derived data** (for example, load data from a third-party API or database in addition to the room `storage`).

You'll also need to keep in mind that for large data sets, you may reach either the 2KB per key and/or 128KiB per value storage limit, or the 128MB total RAM limit of the Room. For simplicity, below examples assume all your "messages" data fits in a single 128KB value.

```ts
export default class Main implements Party.Server {
  constructor(public room: Party.Room) {}
  messages: string[] = [];

  // You can use this to load data from storage and perform other
  // asynchronous initialization. The Room will wait until `onStart` completes before
  // processing any connections or requests.
  async onStart() {
    this.messages = (await this.room.storage.get<string[]>("messages")) ?? [];
  }

  async onConnect(connection: Party.Connection) {
    connection.send(JSON.stringify(this.messages));
  }

  async onMessage(message: string) {
    this.messages.push(message);
    this.room.storage.put("messages", this.messages);
    connection.send(message);
  }
}
```

:::danger[Loading data with Hibernation]
When using the [Hibernation API](/guides/scaling-partykit-servers-with-hibernation/), be careful about loading data on server start.
:::

### Read data when needed

Alternatively, you can read data from `storage` as you need it. The Storage API implements its own in-memory cache, so frequent reads to the same key are likely going to be fast.

This pattern is especially helpful when your app features **frequent writes and less frequent reads**, or when your **read-write ratio is balanced**.

The trade-off is that the programming model is less ergonomic, because you need to perform an asynchronous read from storage every time you access your state.

```ts
export default class Main implements Party.Server {

  constructor(public room: Party.Room) {};

  async readMessages() {
    return this.room.storage.get<string[]>("messages") ?? [];
  };

  async onConnect(connection: Party.Connection) {
    connection.send(JSON.stringify(await this.readMessages()));
  };

  async onMessage(message: string) {
    connection.send(message);

    const messages = await this.readMessages();
    messages.push(message);
    this.room.storage.put("messages", message);
  };
};
```
