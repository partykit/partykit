import type * as Party from "partykit/server";
// import OpenAI from "openai";
import { Ai } from "partykit-ai";

type ChatProps = {
  max_tokens: number;
  messages: {
    content: string;
    name?: string;
    role: "system" | "user" | "assistant";
  }[];
  stop?: string[];
};

export default class AiAutocomplete {
  static async onFetch(req: Party.Request, lobby: Party.FetchLobby) {
    const url = new URL(req.url);
    if (url.pathname !== "/autocomplete" || req.method !== "POST") {
      return new Response("Not found", { status: 404 });
    }

    const props = await req.json<ChatProps>();

    // partykit ai
    console.log("using partykit ai");
    const ai = new Ai(lobby.ai);

    const { response } = await ai.run("@cf/meta/llama-2-7b-chat-int8", props);
    return new Response(response);

    // openai
    // console.log("using openai");
    // const OPENAI_KEY = lobby.env.OPENAI_KEY;
    // if (!OPENAI_KEY) throw new Error("OPENAI_KEY not set");

    // const openai = new OpenAI({
    //   apiKey: OPENAI_KEY as string,
    // });

    // const response = await openai.chat.completions.create({
    //   model: "gpt-4",
    //   ...props,
    // });

    // return new Response(response.choices[0].message.content);
  }
}

AiAutocomplete satisfies Party.Worker;
