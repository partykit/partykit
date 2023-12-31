---
author: Min Chun Fu (Daniel)
pubDatetime: 2023-10-27T19:36:06Z
title: What is Flow, and Why is Partykit being a crucial player?
postSlug: flow-and-partykit-collaboration
featured: false
draft: false
tags:
  - collaboration
  - browser
  - multiplayer
  - partykit
  - flow
ogImage: "/content-images/flow-and-partykit-collaboration/og.png"
description: Making the browser multiplayer is difficult. However, Flow and Partykit's collaboration brings multiplayer to a single website.
---

You know that magic moment when everything clicks? When you finally figure out the answer to a tricky question after hours of study or discover a brilliant workaround that fixes a knotty bug you've wrestled with all day. Flow embodies those "aha" moments and makes sharing your breakthroughs with others effortless.

We've all used the word 'Flow' at some point, expressing the seamless interchange of ideas and thoughts. Flow is woven into our daily interactions, fostering collective wisdom, like individual streams merging to form an expansive, dynamic ocean.

<img src="/content-images/flow-and-partykit-collaboration/screenshot.png" alt=""/>

## Flow and PartyKit: Sculpting Collaboration

Flow isn't merely an app - it's your playground for exploration and a haven for idea exchange. It transcends vanilla comparisons to 'a toned-down version of Notion or Apple Notes.' Flow sets itself apart as an enabler, sparking productive conversations and facilitating seamless collaborations.

From the onset, our alliance with PartyKit laid the cornerstone for this ardent mission. Our goal was to create a platform streamlining brainstorming and resource sharing. It was through this collaboration that Flow began to take shape, interweaving intuitive usability with a rich feature set to simplify and enhance your note-taking experience.

Flow has grown and evolved with each milestone - not just as an application, but as a vessel for igniting collective creativity. We're making collaboration more accessible, engaging, inspiring, and enjoyable. Join us on this journey with [Flow](https://flowapp.so).

## Not Just Whiteboards and Notes

Flow narrows the gap between fleeting thoughts and tangible outcomes, continuously evolving with every hurdle it overcomes and every connection it forms.

When Flow began its journey, PartyKit was there from the start. The aim was simple: mold a collaborative note-taking experience with the Tiptap Editor. As we navigated through the challenges – a duplication problem here, misconfigurations there – we took each one in our stride, refining our approach to ensure flawless syncing and effective collaboration.

No journey is without its bumps, and ours was no exception. But we learn, adapt, and keep Flow-ing. A voyage that began with a simple sample of templates has now blossomed into an all-encompassing, collaboration-driven note-taking solution. Welcome to Flow. Forge connections, share ideas, and weave wonder together.

## Deep dive into Flow's global transformer

What I mean by global transformer is the logic behind it. Many of Flow's syncing components, like Notes and Whiteboard, rely on the `Y.js` library. If you know how to handle that, you are free from using a specific library on an individual "party" to save your documents. (Yes, I am showing the code.)

All of the party kit server code that was needed to implement the real-time syncing on Tiptap (using its collaboration plugin) was the following. **Please read the detailed breakdown below to know how it works! Also, make sure to check out the [official document of PartyKit](https://docs.partykit.io/quickstart/) to understand the class.**

```ts
import { Buffer } from "node:buffer";
import { getSchema } from "@tiptap/core";
import Document from "@tiptap/extension-document";
import Heading from "@tiptap/extension-heading";
import Text from "@tiptap/extension-text";
import { Kysely } from "kysely";
import { PlanetScaleDialect } from "kysely-planetscale";
import type {
  Connection,
  ConnectionContext,
  Party,
  PartyKitServer,
  ServerOptions,
} from "partykit/server";
import { Logger } from "tslog";
import { onConnect } from "y-partykit";
import { yDocToProsemirrorJSON } from "y-prosemirror";
import * as Y from "yjs";

// Types for the database
import type { DB } from "~/types/kysely";

export default class Server implements PartyKitServer {
  options: ServerOptions = { hibernate: false };
  constructor(readonly party: Party) {}

  async onConnect(conn: Connection) {
    const logger = new Logger({
      name: "Party",
    });
    const party = this.party;
    const db = new Kysely<DB>({
      dialect: new PlanetScaleDialect({
        // a hack that is required for partykit to work with planetscale
        url: this.party.env.DATABASE_URL as string,
        fetch: (url: string, init: any) => {
          delete init.cache; // Remove cache header
          return fetch(url, init);
        },
      }),
    });

    return onConnect(conn, party, {
      async load() {
        const doc = new Y.Doc();

        try {
          const {
            document: stateBuffer,
          }: {
            document: Buffer | null;
          } = await db
            .selectFrom("Note")
            .select("Note.document")
            .where("id", "=", party.id)
            .executeTakeFirstOrThrow();

          if (stateBuffer) {
            logger.info("Existing document found: " + party.id);
            const ydoc = new Y.Doc();

            const buffer = Buffer.from(stateBuffer.toString(), "utf-8");
            const uint8Array = new Uint8Array(
              Object.values(JSON.parse(buffer.toString()))
            );

            logger.info("Loading existing document");

            Y.applyUpdate(ydoc, uint8Array);

            logger.info("Loaded existing document");
            return ydoc;
          } else {
            return doc;
          }
        } catch (e) {
          logger.error("Loading Error: ", e);
        }
        logger.info("Loading new document");
        return doc;
      },
      callback: {
        handler: async doc => {
          try {
            const state = Y.encodeStateAsUpdate(doc);
            const stateBuffer = Buffer.from(JSON.stringify(state));

            await db
              .updateTable("Note")
              .set({
                document: stateBuffer,
              })
              .where("Note.id", "=", party.id)
              .execute();

            logger.info("Updated document: " + party.id);
            return;
          } catch (e) {
            logger.error("Callback Error:", e);
          }
        },
      },
    });
  }
}
```

The code above solves the duplication problem and is one of the most used codes in the codebase right now!

## Breakdown

The whole server code is split into two parts: transforming and storing.

### Transforming (How to save YDoc into our database?)

It was trivial

```
const state = Y.encodeStateAsUpdate(doc);
const stateBuffer = Buffer.from(JSON.stringify(state));
```

That will be the only two lines you need!

`encodeStateAsUpdate`

Encode the document state as a single update message, which in this case, turning the document into a single `Unit8array`

I am turning it into a buffer here because of type safety. But you could just store it if your database/schema supports `Unit8Array`

`Y.applyUpdate(ydoc, uint8Array);`

This line is what we use during `onConnect` to apply what we have in the database; what we do is initialize a `new Y.Doc` , if we have stored a document in our database, it would overwrite the blank Y.Doc, or else, it returns the blank as a new document!

## Database (Storing)

`kysely` is the database selection here because it supports native fetch. DrizzleORM would work as well!

⚠️ **Prisma would not work here (Without their acceleration service)**. You need to find a way to write to the database without prisma.

## Reaction to Flow's Syncing Speed

Users were shocked. Despite having lousy internet, they can collaborate in real time. Their work is now in sync.

## Appreciation

Flow would not be this special if not for Sunil and the rest of the party's team. Their enthusiasm is unique, and working alongside them to make the web more collaborative and friendly is incredible.
