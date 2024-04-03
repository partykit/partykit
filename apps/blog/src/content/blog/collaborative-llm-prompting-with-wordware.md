---
author: Robert Chandler
pubDatetime: 2024-04-04T14:00:00Z
title: "Prompt engineering is better with expert friends — Wordware ⨉ PartyKit 🎈"
postSlug: collaborative-llm-prompting-with-wordware
featured: false
tags:
  - AI
  - LLMs
  - collaboration
  - prompting
  - wordware
  - y.js

draft: false
ogImage: "/content-images/collaborative-llm-prompting-with-wordware/og.png"
description: ""
---


If you’re an engineer you know the frustration of a slow dev-test loop. This gets 10 times more frustrating when the test result are inconclusive. How are you meant to fix a program when the error code you’re receiving is *“the vibes are off”*?!?! 🤬

This is the experience when engineers are working on a program made up of prompts for LLMs - so pretty much everything in 2024 😉 - especially when they’re not subject matter experts.

It’s pretty frustrating for the Lawyers, Doctors, marketing gurus and sales aficionados too that are having to generate these vibey error codes. That is, until they use [Wordware](https://wordware.ai).

## Imbuing expertise on LLMs

LLMs are incredible, but they can also suck. The way to make them not suck is to give them the guidance they need to generate useful results, this guidance is called prompting.

Given the outputs of an AI application need to be judged by people that “know what good looks like”, a.k.a. domain experts, it makes the most sense to put the tools in their hands. Unfortunately the tools needed to build this products generally live in the codebase.

*“But why?"*

We found ourselves asking the same question. Prompting is *like* programming but there’s no need for it to live in an ugly monospaced scary-looking IDE designed for rigidly structured syntax where every new line must be represented by `\n` and formatting is forgotten. It can be beautiful 🤩.

Enter: [Wordware](https://wordware.ai).

![An example Hello World Wordware prompt](/content-images/collaborative-llm-prompting-with-wordware/hello-world.png)
_Prompting is the new programming after all 😏. Try the Hello World prompt [here](https://app.wordware.ai/r/8bf57338-7b5b-4ac0-8bd3-b0ebefc0120c)._

Wordware takes prompts out of the codebase and puts them in the hands of domain experts. At its core it’s a beautiful Notion-like IDE built around prompt-first programming. In Wordware you can build powerful chains of prompts with integrated logic (loops, branching, code execution) and deploy them with one click so they can be executed from inside your applications.

![A Notion-like slash command menu in Wordware](/content-images/collaborative-llm-prompting-with-wordware/slash-command.png)

_No more scary code, instead a ‘slash command’ brings up the options. This should be very familiar to Notion users._

On top of all that it’s collaborative! I guess it had to be otherwise why would we be here in the PartyKit blog? 👀

Collaboration really makes the prompting experience a joy. Domain experts can ensure the prompts elicit the perfect response from the LLM, iterating 100s of times an hour whilst leveraging their years of experience with every change. Engineers are free to focus on the logic of the application, building differentiated features inside and outside of Wordware.

It’s also incredibly helpful when we’re onboarding new customers and showing them how best to use the platform.

![Collaborative prompting in Wordware](/content-images/collaborative-llm-prompting-with-wordware/gordon.png)
_Collaborating like a pro 👨‍🍳 ⨉ 🤓 — powered by PartyKit 🎈_


## PartyKit 🎈⨉ Wordware ⨉ TipTap ⨉ SyncedStore

Quite the party 🥳

Let’s dive into the technical details… Wordware’s collaborative interface consists of two main components:

**Prompts** — [ProseMirror](https://prosemirror.net/) documents built on top of [TipTap](https://tiptap.dev/)

**Project state** — a [SyncedStore](https://syncedstore.org/) containing the directory structure, input datasets and additional project metadata (for now just the project name)

SyncedStore is a neat wrapper around the `Y.Doc` from [Y.js](https://yjs.dev/). It transforms a simply defined schema into a collaborative object and efficiently binds updates to the React lifecycle. 

We create our store like so:

```typescript
export const collaborativeStore = syncedStore({
  directory: {} as  { [key: string]: FileOrFolder },
  inputSets: {} as { [promptId: string]: { [inputSetId: string]: InputSet } },
  config: {} as  { name: string },
});
```

This can now become part of the React lifecycle with the `useSyncedStore` hook.

Conveniently PartyKit provides [excellent support for Y.js](https://docs.partykit.io/reference/y-partykit-api/). 

To make our SyncedStore collaborative we can get the Y.js doc with `getYjsDoc` and pass that into our `YPartyKitProvider`:

```typescript
// Get's the Y.js doc from the syncedStore
const doc = getYjsDoc(collaborativeStore);
const host = process.env.NEXT_PUBLIC_PARTYKIT_HOST;

const provider = new YPartyKitProvider(host, partyId, doc, {
  party: "document",
  connect: true,
  // We authenticate against our backed by providing auth tokens in the params
  params: {
    csrfToken,
    sessionToken,
  },
});
```

Finally, all our prompts are created and edited using the TipTap editor. 

It’s trivial to pass in the same `Y.Doc` that is used by the SyncedStore and TipTap’s collaboration extensions will handle storing an additional `Y.XmlFragment` on the doc.

```typescript
const collaborationExtensions = [
  Collaboration.configure({
    document: provider.doc,
    field: documentId,
  }),
  CollaborationCursor.configure({
    provider: provider,
    user: {
      name: username,
      color: getRandomColor(),
    },
  }),
]
```

Having everything offline-first and synchronised is such a wonderful experience. On top of the collaboration it enables multiple prompts to be opened in different browser windows and edited without any issues. Getting this all working in a cost-effective and reliable manner was made a breeze by leveraging PartyKit’s neat abstractions and deployment infrastructure.

We didn’t go into details about persistence here because [Flow’s blog post](https://blog.partykit.io/posts/flow-and-partykit-collaboration) covered it so well. The one additional step we take is to also use the [TiptapTransformer](https://www.npmjs.com/package/@hocuspocus/transformer) to recover the JSON object from the `Y.Doc`.

## Onwards and upwards 🚀

Wordware is just taking off and floating steadily upwards thanks to PartyKit 🎈. We’d love to have you play with the platform - you can [sign up here](https://app.wordware.ai/register) - and ask us all kinds of amazing questions [on our Discord](https://discord.gg/6Zm5FGC2kR).

Looking forward to seeing you there, everything is better with friends after all!

### Example projects

- Generate an entire novel with [AuthorGPT](https://author.wordware.ai)
- Get an angry chef to review your cooking - [Ramsay Roasts](https://roast.wordware.ai)