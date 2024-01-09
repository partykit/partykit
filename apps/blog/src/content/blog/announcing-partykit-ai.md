---
author: Sunil Pai
pubDatetime: 2024-01-09T14:12:00Z
title: "🎈 ⤫ 🤖 Introducing PartyKit AI: Unleashing the Future of Collaborative AI"
postSlug: announcing-partykit-ai
featured: false
tags:
  - AI
  - LLMs
  - Vector DB
  - bots
  - NLP
  - ML

draft: false
ogImage: "/content-images/announcing-partykit-ai/og.png"
description: "A selection of LLMs and a vector database directly in the PartyKit environment, available today."
---

The fusion of multiplayer platforms with AI is not just a trend: it's the future of collaboration. That's why we're thrilled to unveil PartyKit AI, a selection of LLMs and a vector database directly available in the PartyKit environment, powered by Cloudflare's incredible worldwide edge network.

## AI without the hassle

PartyKit AI is designed to make using AI models as straightforward as possible. Whether you're a seasoned developer or a curious innovator, running an AI model in PartyKit is now as simple as:

```typescript
await ai.run("@model", options);
```

## Diverse Range of AI Models at Your Fingertips

PartyKit AI offers an array of models:

- **Text Generation**: Build chat and manipulate text with Llama2 and Mistral.
- **Text to Image Transformation**: Bring your visions to life with Stability Diffusion XL.
- **Speech to Text Conversion**: Capture every word accurately with Whisper.
- **Text and Image Classification**: Categorize and analyze data effortlessly.
- _More to come._

## Empower Your Search with Embeddings and Vector Databases

We've also integrated a **vector database and an embedding model,** allowing for advanced capabilities like semantic search and Retrieval-Augmented Generation (RAG). Our docs and examples show how to create, store, and query embeddings using our vector database, Vectorize.

## Why PartyKit AI?

At the heart of PartyKit is real-time collaboration. The integration of AI is a natural progression of this commitment. When Cloudflare announced Vectorize and Workers AI, we saw the potential of treating AI as a function call. PartyKit AI is our first step towards realizing this vision.

## Flexibility and Extensibility

While we provide first-class support for the above features, PartyKit AI is built for flexibility. Users can connect to third-party vector databases or use alternative Large Language Models (LLMs) beyond Llama2 and Mistral. In fact, an emerging pattern among our early adopters is the use of hosted machine learning models as a preliminary step before calling out to more advanced AI solutions like OpenAI's GPT-4 for user-facing completions. Our goal is to make these AI models easily accessible and integratable with PartyKit's diverse functionality, offering them as managed services within our ecosystem. Further, the combination of long lived multiplayer rooms and AI models opens up a world of possibilities for building AI agents, and true collaborative experiences between humans and AI.

## Getting Started with PartyKit AI

To jumpstart your journey, we've prepared [comprehensive documentation](https://docs.partykit.io/reference/partykit-ai/). Two basic examples show PartyKit AI in action:

![Showing text-to-image and text generation in action.](/content-images/announcing-partykit-ai/demos.png)

- **Using text-to-image** to generate fictional _New Yorker_ cartoons _(left)._ [Code on GitHub.](https://github.com/partykit/sketch-noo-yorker/blob/main/README.md)
- **Chatting with Llama2** in a version of our multiplayer chatroom demo _(right)._ [Code on GitHub.](https://github.com/partykit/sketch-ai-chat-demo/tree/feat/using-partykit-ai)

## Building a Search Engine with PartyKit AI

The power of PartyKit AI lies in the integration of its various components. By combining embeddings with Vectorize, you can create a fully-hosted, AI-driven search engine within the PartyKit framework. For a step-by-step guide and an introduction to Vectorize, [read our new blog post](/posts/using-vectorize-to-build-search).

## What Will You Create?

PartyKit AI is **experimental** so expect it to evolve. We wanted it in your hands as early as possible. However, it's already primed for building incredible real-time AI applications. We're eager to see how you'll use PartyKit AI in your projects.

- [Read the docs](https://docs.partykit.io/reference/partykit-ai/)
- Join our [Discord community](https://discord.gg/GJwKKTcQ7W) to speak with us

Join us in this exciting journey and let's shape the future of collaborative AI together with PartyKit AI!
