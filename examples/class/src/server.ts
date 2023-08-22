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
  readonly party: Party;
  messages: string[];

  constructor(party: Party) {
    this.messages = []; // loaded in onStart
    this.party = party;
  }

  // onBefore* methods run in the worker nearest the user

  static async onBeforeRequest(request: PartyRequest) {
    return request;
  }

  static async onBeforeConnect(request: PartyRequest) {
    return request;
  }

  // on* methods run in the shared room

  async onStart() {
    this.messages = (await this.party.storage.get<string[]>("messages")) ?? [];
  }

  async onConnect(connection: PartyKitConnection) {
    connection.send("Welcome!");
    connection.send(this.getRoomSummary());
  }

  onRequest(_req: PartyRequest): Response | Promise<Response> {
    return new Response(this.getRoomSummary());
  }

  async onMessage(message: string, connection: PartyConnection) {
    this.messages.push(message);
    connection.send(this.getRoomSummary());
    await this.party.storage.put("messages", this.messages);
  }

  async onClose(ws: PartyKitConnection) {
    console.log(`Connection ${ws.id} closed`);
  }

  onError(ws: PartyKitConnection, err: Error) {
    console.log(`Connection ${ws.id} failed with error "${err.message}"`);
  }

  // you can define your own methods on the class

  getRoomSummary() {
    return `There are ${this.messages.length} messages in ${this.party.id} room.`;
  }
}

Main satisfies PartyServerConstructor;
