---
title: Persisting state into storage
description: ...
sidebar:
    hidden: true
---

Each PartyKit room comes with a transactional key-value storage API, that allows you to persist data alongside your party instance.

Because PartyKit servers also allow you to keep in-memory state (link example), persisting data to disk is optional, but necessary when you want the stored data to survive server restarts.

Server restarts happen when:

- The server lifetime reaches the maximum 30 CPU-seconds (better phrasing here) -- source: https://developers.cloudflare.com/durable-objects/platform/limits/#limits
- When you re-deploy the party using `partykit deploy`
- When opting into hibernation (link to guide), when the server is currently not processing messages
- Unexpected error in the PartyKit runtime (e.g. hardware fault)

Essentially, if you want to guarantee that your party state is not lost at any of these events, you'll need to save the state somewhere and reload it when your party starts up again.

You can store your state in a third-party database such as PlanetScale, or send it to an arbitrary API endpoint that you choose, but the most convenient storage options is to use `Party.storage` (reference link).

## Data format

You can store most types of data without having to serialize them to JSON. 
- The key must be a string with a max size of 2,048 bytes.
- The value can be any type supported by the [structured clone algorithm](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm), limited to 128 KiB (131,072 bytes) per value
^ from partyserver-api 



### Storing large amounts of data

There is no practical limit to how many keys each party can store, so with thoughful data model design, you can store large amounts of data in a Party by sharding across multiple keys.

Sylwia: Repurpose code example from Hibernation doc.

Keep in mind that each Party only has 128MB of memory, so you'll need to also be thoughtful about read-patterns of the data, and not read vast amounts of data to memory when loading from storage.

## API

get, put, list, delete

https://developers.cloudflare.com/durable-objects/api/transactional-storage-api/

### Reading data

```ts
const data = await this.party.storage.get<OptionalTypeDefinition>("key");
```

### Writing data

```ts
await this.party.storage.put("key", value)
```

### Deleting data

```ts
await this.party.storage.delete("key")
```

### Listing items

Returns a map of all items in storage.

```ts
const items = await this.party.storage.list();
for (const [key, value] of items) {
    console.log(key, value);
}
```

You should only use this operation when you need to iterate through all of the items in storage. Otherwise, use `get` instead.

Sylwia: https://developers.cloudflare.com/durable-objects/api/transactional-storage-api/
> Be aware of how much data may be stored in your Durable Object before calling this version of list without options because all the data will be loaded into the Durable Object’s memory, potentially hitting its limit. If that is a concern, pass options to list as documented below.

If you only need access to the keys, you can do this:
```ts
const keys = [...(await this.party.storage.list()).keys()];
```


## Data access patterns

### Read data up front in `onStart`

A common pattern is to read the data from storage into memory when the server starts. This way, the data is accessible in a convenient format.

This pattern makes sense when you have frequent reads and infrequent writes, or when you need to join multiple data sets to create derived data (e.g. load data from a third-party API or database in addition to the party storage).

You'll also need to keep in mind that for large data sets, you may reach either the 128KB per key storage limit, or the 128MB total RAM limit of the Party. For simplicity, below examples assume all your "messages" data fits in a single 128KB value.

```ts
export default class Main implements Party.Server {

  constructor(public party: Party.Party) {}

  messages: string[] = [];

  // You can use this to load data from storage and perform other
  // asynchronous initialization. The Party will wait until `onStart` completes before
  // processing any connections or requests.
  async onStart() {
    this.messages = (await this.party.storage.get<string[]>("messages")) ?? [];
  }
  
  async onConnect(connection: Party.Connection) {
    connection.send(JSON.stringify(this.messages));
  }

  async onMessage(message: string) {
    this.messages.push(message);
    this.party.storage.put("messages", message);
    connection.send(message);
  }
```

Warning: When using Hibernation (link), be careful about loading data on server start.

### Read data as it's needed

Alternatively, you can read data from storage as and when you need it. The storage API implements its own in-memory cache, so frequent reads to the same key are likely going to be fast.

The tradeoff is that the programming model is less ergonomic, because you need to perform an asynchronous read from storage every time you need access to your state.

This pattern works well when you have frequent writes, and less frequent reads, or when your read-write ratio is approximately 1:1.

```ts
export default class Main implements Party.Server {

  constructor(public party: Party.Party) {}

  async readMessages() {
    return this.party.storage.get<string[]>("messages")) ?? [];
  }
  async onConnect(connection: Party.Connection) {
    connection.send(JSON.stringify(await this.readMessages()));
  }

  async onMessage(message: string) {
    connection.send(message);

    const messages = await this.readMessages();
    messages.push(message);
    this.party.storage.put("messages", message);
  }
```








