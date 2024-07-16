---
title: 🤖 ⤫ 🎈 PartyKit AI
description: PartyKit AI reference
sidebar:
  order: 3
---

:::caution[Experimental]
PartyKit AI is currently in Open Beta and is not recommended for production data and traffic, and limits + access are subject to change
:::

Build AI-powered real-time collaborative applications with PartyKit AI. Powered by [Cloudflare AI](https://ai.cloudflare.com/), PartyKit brings you models for a variety of use cases, including: text and image generation, translation, text-to-speech, and more. It also includes a vector database (powered by [Cloudflare Vectorize](https://developers.cloudflare.com/vectorize/)) to build search engines and [RAG](https://blogs.nvidia.com/blog/what-is-retrieval-augmented-generation/) applications.

:::tip[Learn more]
Learn more about building a search engine for your content with [Matt Webb's Braggoscope](https://blog.partykit.io/posts/using-vectorize-to-build-search)
:::

## Models: Text, Images, and more

To get started with using an AI model, first install the `partykit-ai` package in your PartyKit project:

```bash
npm install partykit-ai
```

Then, import the `partykit-ai` package in your server code:

```ts
import { Ai } from "partykit-ai";
import type * as Party from "partykit/server";

export default class Server implements Party.Server {
  ai: Ai;
  constructor(public room: Party.Room) {
    this.ai = new Ai(room.context.ai);
  }
  onConnect(connection: Party.Connection) {
    // ...
  }
}
```

You can also use the package for non-party, regular api endpoints with [onFetch](https://docs.partykit.io/reference/partyserver-api/#static-onfetch) / [onSocket](https://docs.partykit.io/reference/partyserver-api/#static-onsocket) / [onCron](https://docs.partykit.io/reference/partyserver-api/#static-oncron):

```ts
export default class {
  static onFetch(request, lobby, ctx) {
    const ai = new Ai(lobby.ai);
    // ... call models
  }
}
```

The `partykit-ai` package is a wrapper on top of `@cloudflare/ai`, so you can use the same API to access the models. For example, you could use the text-generation model to build a chatbot [as described here](https://developers.cloudflare.com/workers-ai/models/text-generation/). Learn more at the [Workers AI documentation](https://developers.cloudflare.com/workers-ai).

:::tip[Available models]
You can list all available models and their usecases by running `npx partykit ai models` in your terminal.
:::

As an example, here's a fetch handler that uses the text-generation model to get a description for a word:

```ts
import { Ai } from "partykit-ai";
import type * as Party from "partykit/server";

export default class {
  static async onFetch(request: Party.Request, lobby: Party.FetchLobby) {
    const ai = new Ai(lobby.ai);
    const result = await ai.run("@cf/meta/llama-2-7b-chat-int8", {
      messages: [
        { role: "system", content: "You are a friendly assistant" },
        {
          role: "user",
          content: "What is the origin of the phrase Hello, World"
        }
      ],
      stream: true
    });

    return new Response(result, {
      headers: { "content-type": "text/event-stream" }
    });
  }
}
```

## Vectorize: Build your own search engine

PartyKit AI includes a vector database (powered by [Cloudflare Vectorize](https://developers.cloudflare.com/vectorize/)) to build search engines and [RAG](https://blogs.nvidia.com/blog/what-is-retrieval-augmented-generation/) applications.

## Commands

You can list all available commands by running `npx partykit vectorize` in your terminal.

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
npx partykit vectorize create my-index --dimensions <dimensions> --metric <type>

# or

npx partykit vectorize create my-index --preset <preset>
# where <preset> is one of:
# - @cf/baai/bge-small-en-v1.5
# - @cf/baai/bge-base-en-v1.5
# - @cf/baai/bge-large-en-v1.5
# - openai/text-embedding-ada-002
```

### delete <index>

Delete a vectorize index

```bash
npx partykit vectorize delete my-index
```

### get <index>

Get a vectorize index' details by name

```bash
npx partykit vectorize get my-index
```

### list

List all vectorize indexes

```bash
npx partykit vectorize list
```

### insert <index>

Insert vectors into a Vectorize index

```bash
npx partykit vectorize insert my-index --file <filename>
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

// OR for non-party, regular api endpoints with onFetch / onSocket / onCron

export default class {
  static onFetch(request, lobby, ctx) {
    const myIndex = lobby.vectorize.myIndex;
    // ... call functions on myIndex
  }
}
```

### Vectors

A vector represents the vector embedding output from a machine learning model.

- `id` - a unique `string` identifying the vector in the index. This should map back to the ID of the document, object or database identifier that the vector values were generated from.
- `namespace` - an optional partition key within a index. Operations are performed per-namespace, so this can be used to create isolated segments within a larger index.
- `values` - an array of `number`, `Float32Array`, or `Float64Array` as the vector embedding itself. This must be a dense array, and the length of this array must match the dimensions configured on the index.
- `metadata` - an optional set of key-value pairs that can be used to store additional metadata alongside a vector.

```ts
let vectorExample = {
  id: "12345",
  values: [32.4, 6.55, 11.2, 10.3, 87.9],
  metadata: {
    key: "value",
    hello: "world",
    url: "r2://bucket/some/object.json"
  }
};
```

### insert

Insert vectors into a Vectorize index

```ts
await myIndex.insert([
  { id: "1", values: [1, 2, 3] },
  { id: "2", values: [4, 5, 6] }
]);
```

### upsert

Upsert vectors into a Vectorize index

```ts
await myIndex.upsert([
  { id: "1", values: [1, 2, 3] },
  { id: "2", values: [4, 5, 6] }
]);
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

You can also query by namespace:

```ts
const result = await myIndex.query(
  [1, 2, 3], // generate this vector with an embedding model
  {
    topK: 15,
    returnValues: false,
    returnMetadata: true,
    namespace: "my-namespace"
  }
);
```

Further, you can [filter results by metadata](#metadata-filtering).

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

## Metadata Filtering

In addition to providing an input vector to your query, you can also filter by vector metadata associated with every vector. Query results only include vectors that match `filter` criteria, meaning that `filter` is applied first, and `topK` results are taken from the filtered set.

By using metadata filtering to limit the scope of a query, you can filter by specific customer IDs, tenant, product category or any other metadata you associate with your vectors.

## Supported operations

Optional `filter` property on `query()` method specifies metadata filter:

| Operator | Description |
| -------- | ----------- |
| `$eq`    | Equals      |
| `$ne`    | Not equals  |

- `filter` must be non-empty object whose compact JSON representation must be less than 2048 bytes.
- `filter` object keys cannot be empty, contain `" | .` (dot is reserved for nesting), start with `$`, or be longer than 512 characters.
- `filter` object non-nested values can be `string`, `number`, `boolean`, or `null` values.

### Namespace versus metadata filtering

Both namespaces and metadata filtering narrow the vector search space for a query. Consider the following when evaluating both filter types:

- A namespace filter is applied before metadata filter(s).
- A vector can only be part of a single namespace. Vector metadata can contain multiple key-value pairs. Metadata values support different types (`string`, `boolean`, and others), therefore offering more flexibility.

### Valid `filter` examples

#### Implicit `$eq` operator

```json
{ "streaming_platform": "netflix" }
```

#### Explicit operator

```json
{ "someKey": { "$ne": true } }
```

#### Implicit logical `AND` with multiple keys

```json
{ "pandas.nice": 42, "someKey": { "$ne": true } }
```

#### Keys define nesting with `.` (dot)

```json
{ "pandas.nice": 42 }


// looks for { "pandas": { "nice": 42 } }
```

## Examples

### Add metadata

With the following index definition:

```sh
$ npx partykit vectorize create tutorial-index --dimensions=3 --metric=cosine
```

Metadata can be added when [inserting or upserting vectors](#insert).

```ts
const newMetadataVectors = [
  {
    id: "1",
    values: [32.4, 74.1, 3.2],
    metadata: { url: "/products/sku/13913913", streaming_platform: "netflix" }
  },
  {
    id: "2",
    values: [15.1, 19.2, 15.8],
    metadata: { url: "/products/sku/10148191", streaming_platform: "hbo" }
  },
  {
    id: "3",
    values: [0.16, 1.2, 3.8],
    metadata: { url: "/products/sku/97913813", streaming_platform: "amazon" }
  },
  {
    id: "4",
    values: [75.1, 67.1, 29.9],
    metadata: { url: "/products/sku/418313", streaming_platform: "netflix" }
  },
  {
    id: "5",
    values: [58.8, 6.7, 3.4],
    metadata: { url: "/products/sku/55519183", streaming_platform: "hbo" }
  }
];

// Upsert vectors with added metadata, returning a count of the vectors upserted and their vector IDs
let upserted = await env.YOUR_INDEX.upsert(newMetadataVectors);
```

### Query examples

Use the `query()` method:

```ts
let queryVector = [54.8, 5.5, 3.1];
// Best match is vector id = 5 (score closet to 1)
let originalMatches = await YOUR_INDEX.query(queryVector, {
  topK: 3,
  returnValues: true,
  returnMetadata: true
});
```

Results without metadata filtering:

```json
{
  "matches": [
    {
      "id": "5",
      "score": 0.999909486,
      "values": [58.79999923706055, 6.699999809265137, 3.4000000953674316],
      "metadata": {
        "url": "/products/sku/55519183",
        "streaming_platform": "hbo"
      }
    },
    {
      "id": "4",
      "score": 0.789848214,
      "values": [75.0999984741211, 67.0999984741211, 29.899999618530273],
      "metadata": {
        "url": "/products/sku/418313",
        "streaming_platform": "netflix"
      }
    },
    {
      "id": "2",
      "score": 0.611976262,
      "values": [15.100000381469727, 19.200000762939453, 15.800000190734863],
      "metadata": {
        "url": "/products/sku/10148191",
        "streaming_platform": "hbo"
      }
    }
  ]
}
```

The same `query()` method with a `filter` property supports metadata filtering.

```ts
let queryVector = [54.8, 5.5, 3.1];
// Best match is vector id = 4 with metadata filter
let metadataMatches = await YOUR_INDEX.query(queryVector, {
  topK: 3,
  filter: { streaming_platform: "netflix" },
  returnValues: true,
  returnMetadata: true
});
```

Results with metadata filtering:

```json
{
  "matches": [
    {
      "id": "4",
      "score": 0.789848214,
      "values": [75.0999984741211, 67.0999984741211, 29.899999618530273],
      "metadata": {
        "url": "/products/sku/418313",
        "streaming_platform": "netflix"
      }
    },
    {
      "id": "1",
      "score": 0.491185264,
      "values": [32.400001525878906, 74.0999984741211, 3.200000047683716],
      "metadata": {
        "url": "/products/sku/13913913",
        "streaming_platform": "netflix"
      }
    }
  ]
}
```
