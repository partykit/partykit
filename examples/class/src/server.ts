import type {
  Party,
  PartyConnection,
  PartyKitConnection,
  PartyRequest,
  PartyServer,
  PartyServerConstructor,
  PartyServerOptions,
} from "partykit/server";

export default class Main implements PartyServer {
  // explicit options
  readonly options: PartyServerOptions = {
    hibernate: false,
  };

  messages: string[] = [];

  constructor(readonly party: Party) {
    console.log("Constructor", party.id, this.messages.length);
  }

  static async onBeforeRequest(request: PartyRequest) {
    console.log("onBeforeRequest", request.url);
    // TODO: fixme
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return request;
  }

  static async onBeforeConnect(request: PartyRequest) {
    console.log("onBeforeConnect", request.url);
    // TODO: fixme
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return request;
  }

  async onStart() {
    this.messages = (await this.party.storage.get<string[]>("messages")) ?? [];
    console.log("onStart", this.party.id, this.messages.length);
  }

  async onConnect(connection: PartyKitConnection) {
    console.log("onConnect", this.party.id, this.messages.length);
    connection.send("Welcome!");
    connection.send(`There are ${this.messages.length} messages in this room`);
  }
  // party (previously PartyKitRoom is available

  onRequest(_req: PartyRequest): Response | Promise<Response> {
    console.log("onRequest", this.party.id, this.messages.length);
    return new Response(
      `There are ${this.messages.length} messages in this room`
    );
  }

  async onMessage(message: string, connection: PartyConnection) {
    this.messages.push(message);
    await this.party.storage.put("messages", this.messages);
    connection.send(`There are ${this.messages.length} messages in this room`);
    console.log("onMessage", this.party.id, this.messages.length);
  }
}

Main satisfies PartyServerConstructor;
