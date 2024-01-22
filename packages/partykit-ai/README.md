## 🎈 ⤫ 🤖 PartyKit AI

_(NB: This is experimental and subject to change)_

### Usage

First install the package:

```bash
npm install partykit-ai
```

Then import the package and use it:

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

### Details

This package is a fork of [Cloudflare's AI package](https://npmjs.com/package/@cloudflare/ai), and is powered by Cloudflare's AI models (https://ai.cloudflare.com/). The API closely matches the original, learn more here: https://developers.cloudflare.com/workers-ai

### Coming soon

- Support for [AI Gateway](https://developers.cloudflare.com/ai-gateway)
- Examples
