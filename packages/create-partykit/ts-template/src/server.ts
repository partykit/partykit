import type {
  Party,
  PartyConnection,
  PartyConnectionContext,
  PartyServer,
  PartyWorker,
} from "partykit/server";

export default class Server implements PartyServer {
  constructor(readonly party: Party) {}

  onConnect(conn: PartyConnection, ctx: PartyConnectionContext) {
    // A websocket just connected!
    console.log(
      `Connected:
  id: ${conn.id}
  room: ${this.party.id}
  url: ${new URL(ctx.request.url).pathname}`
    );

    // let's send a message to the connection
    conn.send("hello from server");
  }

  onMessage(message: string, sender: PartyConnection) {
    // let's log the message
    console.log(`connection ${sender.id} sent message: ${message}`);
    // as well as broadcast it to all the other connections in the room...
    this.party.broadcast(
      `${sender.id}: ${message}`,
      // ...except for the connection it came from
      [sender.id]
    );
  }
}

Server satisfies PartyWorker;
