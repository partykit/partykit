import type {
  Party,
  PartyKitConnection,
  PartyKitRequest,
  PartyKitResponse,
  PartyServer,
  PartyServerConstructor,
  PartyServerOptions,
} from "partykit/server";

export default class Main implements PartyServer {
  // explicit options
  readonly options: PartyServerOptions = {
    hibernate: true,
  };

  // party (previously PartyKitRoom is available
  constructor(readonly party: Party) {}

  messages: string[] = [];
  async onStart() {
    this.messages = (await this.party.storage.get<string[]>("messages")) ?? [];
  }

  static onBeforeRequest(req: Request) {
    return new Response("Intercepted at worker " + req.url);
  }

  onRequest(req: PartyKitRequest): PartyKitResponse {
    return new Response(`Hello from party ${this.party.id}`);
  }

  async onConnect(connection: PartyKitConnection) {
    connection.send(
      `Welcome. There are ${this.messages.length} messages in the backlog`
    );
  }

  async onMessage(message: string) {
    this.messages.push(message);
    await this.party.storage.put("messages", this.messages);
  }
}

Main satisfies PartyServerConstructor;
