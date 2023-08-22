import type {
  Party,
  PartyConnection,
  PartyRequest,
  PartyServer,
  PartyWorker,
  PartyServerOptions,
} from "partykit/server";

export default class Main implements PartyServer {
  // explicit options
  readonly options: PartyServerOptions = {
    hibernate: true,
  };

  readonly party: Party;
  messages: string[];

  constructor(party: Party) {
    this.messages = []; // loaded in onStart
    this.party = party;
  }

  // static methods run in the worker nearest the user

  static async onFetch(req: PartyRequest) {
    return new Response("Hello from " + req.url);
  }

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

  getConnectionTags(
    _connection: PartyConnection
  ): string[] | Promise<string[]> {
    const team = this.party.connections.size % 2 === 0 ? "red" : "green";
    return [team];
  }

  async onConnect(connection: PartyConnection) {
    connection.send("Welcome!");
    connection.send(this.getRoomSummary());
    connection.send(
      "Red team: " + [...this.party.getConnections("red")].length
    );
    connection.send(
      "Green team: " + [...this.party.getConnections("green")].length
    );
  }

  onRequest(_req: PartyRequest): Response | Promise<Response> {
    return new Response(this.getRoomSummary());
  }

  async onMessage(message: string, connection: PartyConnection) {
    this.messages.push(message);
    connection.send(this.getRoomSummary());
    await this.party.storage.put("messages", this.messages);
  }

  async onClose(ws: PartyConnection) {
    console.log(`Connection ${ws.id} closed`);
  }

  onError(ws: PartyConnection, err: Error) {
    console.log(`Connection ${ws.id} failed with error "${err.message}"`);
  }

  // you can define your own methods on the class

  getRoomSummary() {
    return `There are ${this.messages.length} messages in ${this.party.id} room.`;
  }
}

Main satisfies PartyWorker;
