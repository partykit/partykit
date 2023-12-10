import type * as Party from "partykit/server";

import { Ai } from "party-ai";

export default class Server implements Party.Server {
  ai = new Ai();
  constructor(readonly party: Party.Party) {}

  async onRequest(_request: Party.Request): Promise<Response> {
    // console.log(request);
    const messages = [
      { role: "system", content: "You are a friendly assistant" },
      {
        role: "user",
        content: "What is the origin of the phrase Hello, World",
      },
    ];
    console.log("request");
    const stream = await this.ai.run("@cf/meta/llama-2-7b-chat-int8", {
      messages,
      // stream: true,
    });
    console.log(stream);
    return Response.json(stream, {
      // headers: { "content-type": "text/event-stream" },
    });
  }
}

Server satisfies Party.Worker;
