import type * as Party from "partykit/server";

// Connections can carry optional state, which you can set with .setState()
type Connection = Party.Connection<{ country: string | undefined }>;

// PartyKit servers now implement PartyServer interface
export default class Main implements Party.Server {
  // onBefore* handlers that run in the worker nearest the user are now
  // explicitly marked static, because they have no access to Party state
  static async onBeforeRequest(req: Party.Request, lobby: Party.Lobby) {
    await lobby.parties.main.get(lobby.id).fetch("/foo");
    await lobby.parties.main.get(lobby.id).fetch(req);

    await lobby.parties.main.get(lobby.id).fetch(req.url, req);

    return req;
  }
  static async onBeforeConnect(req: Party.Request) {
    return req;
  }
  // onFetch is now stable. No more unstable_onFetch
  static async onFetch(req: Party.Request) {
    return new Response("Unrecognized request: " + req.url, { status: 404 });
  }

  // Opting into hibernation is now an explicit option
  readonly options: Party.ServerOptions = {
    hibernate: true
  };

  // Servers can now keep state in class instance variables
  messages: string[] = [];

  // PartyServer receives the Room (previous PartyKitRoom) as a constructor argument
  // instead of receiving the `room` argument in each method.

  constructor(public room: Party.Room) {}

  // There's now a new lifecycle method `onStart` which fires before first connection
  // or request to the room. You can use this to load data from storage and perform other
  // asynchronous initialization. The Room will wait until `onStart` completes before
  // processing any connections or requests.
  async onStart() {
    this.messages = (await this.room.storage.get<string[]>("messages")) ?? [];
  }

  // You can now tag connections, and retrieve tagged connections using Party.getConnections()
  getConnectionTags(connection: Connection, ctx: Party.ConnectionContext) {
    const country = (ctx.request.cf?.country as string) ?? "somewhere";

    // You can also set state on connection
    connection.setState({ country });

    return [country];
  }

  // onConnect, onRequest, onAlarm no longer receive the room argument.
  async onRequest(_req: Party.Request) {
    return new Response(
      `Party ${this.room.id} has received ${this.messages.length} messages`
    );
  }
  async onConnect(connection: Connection, ctx: Party.ConnectionContext) {
    // You can now read the room state from `this.room` instead.
    this.room.broadcast(
      "A new connection has joined the party! Say hello to " + connection.id
    );

    // room.connections is now called room.getConnections(tag?)
    // that receives an optional tag argument to filter connections
    const country = ctx.request.cf?.country as string;
    for (const compatriot of this.room.getConnections(country)) {
      compatriot.send(`${connection.id} is also from ${country}!`);
    }
  }

  // Previously onMessage, onError, onClose were only called for hibernating parties.
  // They're now available for all parties, so you no longer need to manually
  // manage event handlers in onConnect!
  async onMessage(message: string, connection: Connection) {
    connection.send(`Pong from ${connection.state?.country}!`);
    this.room.broadcast(message, [connection.id]);
  }
  async onError(connection: Party.Connection, err: Error) {
    console.log("Error from " + connection.id, err.message);
  }
  async onClose(connection: Party.Connection) {
    console.log("Closed " + connection.id);
  }
}

// Optional: Typecheck the static methods with a `satisfies` statement.
Main satisfies Party.Worker;
