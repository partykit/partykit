---
title: How PartyKit works
description: Understand the underlying technology of any PartyKit app
---

PartyKit is an open source deployment platform for AI agents, multiplayer and local-first apps, games, and websites, and especially with collaborative experiences.

<!--
The PartyKit runtime is a modern standards-based JavaScript runtime based on the [`workerd`](https://github.com/cloudflare/workerd) runtime by Cloudflare that powers [Cloudflare Workers](https://workers.cloudflare.com/) In addition to running modern JavaScript, it also supports [TypeScript](https://www.typescriptlang.org/), thousands of modules from [the npm registry](https://www.npmjs.com/), and [WebAssembly modules](https://webassembly.org/).
-->


The core of any PartyKit project is called a Party, which is a single instance of a server (or a [Durable Object](/glossary/#durable-object)).


<!-- here a graph of the PK connection -->
<!-- here a description of the graph -->