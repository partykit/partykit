## 🎈 ⤫ 🤖 PartyKit AI

_(NB: This is experimental and subject to change)_

### Usage

First install the package:

```bash
npm install partykit-ai
```

Then import the package and use it:

```ts
import type * as Party from "partykit/server";
import { Ai } from "partykit-ai";

export default class {
  ai: Ai;
  constructor(public party: Party.Party) {
    this.ai = new Ai(this.party.ai);
  }
  onRequest(request: Party.Request) {
    const messages = [
      { role: "system", content: "You are a friendly assistant" },
      {
        role: "user",
        content: "What is the origin of the phrase Hello, World",
      },
    ];
    const stream = await this.ai.run("@cf/meta/llama-2-7b-chat-int8", {
      messages,
      stream: true,
    });

    return new Response(stream, {
      headers: { "content-type": "text/event-stream" },
    });
  }
}
```

### Details

This package is a fork of [Cloudflare's AI package](https://npmjs.com/package/@cloudflare/ai), and is powered by Cloudflare's AI models (https://ai.cloudflare.com/). The API closely matches the original, learn more here: https://developers.cloudflare.com/workers-ai

### Deploying

For deploying to production, you have 2 options:

- Reach out to Sunil on the discord and enable your account for the AI service
- Reach out to Sunil on the discord and enable your account for deploying to your own CF account

### Coming soon

- Support for [AI Gateway](https://developers.cloudflare.com/ai-gateway)
- Examples
