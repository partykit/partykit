---
title: 🤖 ⤫ 🎈 PartyKit AI
description: PartyKit AI reference
sidebar:
  order: 3
---

:::caution[Experimental]
PartyKit AI is currently in Open Beta and is not recommended for production data and traffic, and limits + access are subject to change
:::

Build AI-powered real-time collaborative applications with PartyKit AI. Powered by [Cloudflare AI](https://ai.cloudflare.com/), PartyKit brings you models for a veriety of use cases, including: text and image generation, translation, text-to-speech, and more. It also includes a vector database (powered by [Cloudflare Vectorize](https://developers.cloudflare.com/vectorize/)) to build search engines and [RAG](https://blogs.nvidia.com/blog/what-is-retrieval-augmented-generation/) applications.

## Models: Text, Images, and more

To get started with using an AI model, first install the `partykit-ai` package in your PartyKit project:

```bash
npm install partykit-ai
```

Then, import the `partykit-ai` package in your server code:

```ts
import type * as Party from "partykit/server";
import { Ai } from "partykit-ai";

export default class Server implements Party.Server {
  ai: Ai;
  constructor(public room: Party.Room) {
    this.ai = new Ai(room.ai);
  }
  onConnect(connection: Party.Connection) {
    // ...
  }
}
```

You can also use the package for non-party, regular api endpoints with [onFetch](https://docs.partykit.io/reference/partyserver-api/#static-onfetch) / [onSocket](https://docs.partykit.io/reference/partyserver-api/#static-onsocket) / [onCron](https://docs.partykit.io/reference/partyserver-api/#static-oncron):

```ts
export default class {
  static onFetch(request, env, ctx) {
    const ai = new Ai(env.ai);
    // ... call models
  }
}
```

The `partykit-ai` package is a wrapper on top of `@cloudflare/ai`, so you can use the same API to access the models. For example, you could use the text-generation model to build a chatbot [as described here](https://developers.cloudflare.com/workers-ai/models/text-generation/). Learn more at the [Workers AI documentation](https://developers.cloudflare.com/workers-ai).

:::tip[Available models]
You can list all available models and their usecases by running `npx partykit ai models` in your terminal.
:::

## Vectorize: Build your own search engine

PartyKit AI includes a vector database (powered by [Cloudflare Vectorize](https://developers.cloudflare.com/vectorize/)) to build search engines and [RAG](https://blogs.nvidia.com/blog/what-is-retrieval-augmented-generation/) applications.

## Commands

You can list all available commands by running `npx partykit ai vectorize` in your terminal.

```
🎈 PartyKit
------------
Usage: partykit vectorize [options] [command]

Manage vectorize indexes

Options:
  -h, --help               display help for command

Commands:
  create [options] <name>  Create a vectorize index
  delete [options] <name>  Delete a vectorize index
  get [options] <name>     Get a vectorize index by name
  list [options]           List all vectorize indexes
  insert [options] [name]  Insert vectors into a Vectorize index
```

### create <index>

Create a vectorize index

```bash
npx partykit ai vectorize create my-index --dimensions <dimensions> --metric <type>

# or

npx partykit ai vectorize create my-index --preset <preset>
# where <preset> is one of:
# - @cf/baai/bge-small-en-v1.5
# - @cf/baai/bge-base-en-v1.5
# - @cf/baai/bge-large-en-v1.5
# - openai/text-embedding-ada-002
```

### delete <index>

Delete a vectorize index

```bash
npx partykit ai vectorize delete my-index
```

### get <index>

Get a vectorize index' details by name

```bash
npx partykit ai vectorize get my-index
```

### list

List all vectorize indexes

```bash
npx partykit ai vectorize list
```

### insert <index>

Insert vectors into a Vectorize index

```bash
npx partykit ai vectorize insert my-index --file <filename>
```

## API

You can also interact with the vectorize index from your server code. After configuring your index in `partykit.json` like so:

```jsonc
{
  // ...
  "vectorize": {
    "myIndex": {
      "index_name": "my-index"
    }
  }
}
```

You can access it from your server code like so:

```ts
import type * as Party from "partykit/server";
export default class implements Party.Server {
  constructor(public room: Party.Room) {}
  async onConnect(connection: Party.Connection) {
    const myIndex = this.room.context.vectorize.myIndex;
    // ... call functions on myIndex
  }
}
```

### insert

Insert vectors into a Vectorize index

```ts
await myIndex.insert({
  vectors: [
    { id: "1", vector: [1, 2, 3] },
    { id: "2", vector: [4, 5, 6] },
  ],
});
```

### upsert

Upsert vectors into a Vectorize index

```ts
await myIndex.upsert({
  vectors: [
    { id: "1", vector: [1, 2, 3] },
    { id: "2", vector: [4, 5, 6] },
  ],
});
```

### query

Query a Vectorize index

```ts
const result = await myIndex.query(
  [1, 2, 3], // generate this vector with an embedding model
  { topK: 15, returnValues: false, returnMetadata: true }
);

// result is an array of { vectorId: string, score: number } objects
```

### getByIds

Get vectors by ids

```ts
const result = await myIndex.getByIds(["1", "2"]);
```

### deleteByIds

Delete vectors by ids

```ts
await myIndex.deleteByIds(["1", "2"]);
```

### describe

Retrieves the configuration of a given index directly, including its configured dimensions and distance metric.

```ts
const result = await myIndex.describe();
```

:::tip[Learn more]
Learn more about building a search engine for your content with [Matt Webb's Braggoscope](#todo)
:::
