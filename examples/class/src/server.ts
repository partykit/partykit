import type {
  Party,
  PartyConnection,
  PartyRequest,
  PartyServer,
  PartyWorker,
  PartyServerOptions,
  PartyConnectionContext,
} from "partykit/server";

// PartyKit servers now implement PartyServer interface
export default class Main implements PartyServer {
  // onBefore* handlers that run in the worker nearest the user are now
  // explicitly marked static, because they have no access to Party state
  static async onBeforeRequest(req: PartyRequest) {
    return req;
  }
  static async onBeforeConnect(req: PartyRequest) {
    return req;
  }
  // onFetch is now stable. No more unstable_onFetch
  static async onFetch(req: PartyRequest) {
    return new Response("Unrecognized request: " + req.url, { status: 404 });
  }

  // Opting into hibernation is now an explicit option
  readonly options: PartyServerOptions = {
    hibernate: true,
  };

  // Servers can now keep state in class instance variables
  messages: string[] = [];

  // PartyServer receives the Party (previous PartyKitRoom) as a constructor argument
  // instead of receiving the `room` argument in each method.
  readonly party: Party;
  constructor(party: Party) {
    this.party = party;
  }

  // There's now a new lifecycle method `onStart` which fires before first connection
  // or request to the room. You can use this to load data from storage and perform other
  // asynchronous initialization. The Party will wait until `onStart` completes before
  // processing any connections or requests.
  async onStart() {
    this.messages = (await this.party.storage.get<string[]>("messages")) ?? [];
  }

  // You can now tag connections, and retrieve tagged connections using Party.getConnections()
  getConnectionTags(connection: PartyConnection, ctx: PartyConnectionContext) {
    const country = (ctx.request.cf?.country as string) ?? "unknown";
    return [country];
  }

  // onConnect, onRequest, onAlarm no longer receive the room argument.
  async onRequest(_req: PartyRequest) {
    return new Response(
      `Party ${this.party.id} has received ${this.messages.length} messages`
    );
  }
  async onConnect(connection: PartyConnection, ctx: PartyConnectionContext) {
    // You can now read the room state from `this.party` instead.
    this.party.broadcast(
      "A new connection has joined the party! Say hello to " + connection.id
    );

    // room.connections is now called room.getConnections(tag?)
    // that receives an optional tag argument to filter connections
    const country = ctx.request.cf?.country as string;
    for (const compatriot of this.party.getConnections(country)) {
      compatriot.send(`${connection.id} is also from ${country}!`);
    }
  }

  // Previously onMessage, onError, onClose were only called for hibernating parties.
  // They're now available for all parties, so you no longer need to manually
  // manage event handlers in onConnect!
  async onMessage(message: string, connection: PartyConnection) {
    connection.send("Pong!");
    this.party.broadcast(message, [connection.id]);
  }
  async onError(connection: PartyConnection, err: Error) {
    console.log("Error from " + connection.id, err.message);
  }
  async onClose(connection: PartyConnection) {
    console.log("Closed " + connection.id);
  }
}

// Optional: Typecheck the static methods with a `satisfies` statement.
Main satisfies PartyWorker;
