// @ts-expect-error boop
import { Ai } from "partykit-ai";
import type * as Party from "partykit/server";

export default class Server implements Party.Server {
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

Server satisfies Party.Worker;
