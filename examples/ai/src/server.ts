import type * as Party from "partykit/server";

import { Ai } from "partykit-ai";

export default class Server implements Party.Server {
  ai: Ai;
  constructor(public party: Party.Party) {
    this.ai = new Ai(this.party.ai);
  }

  async onRequest(_request: Party.Request): Promise<Response> {
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

Server satisfies Party.Worker;
