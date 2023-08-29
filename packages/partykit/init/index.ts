import type {
  PartyKitConnection,
  PartyKitContext,
  PartyKitRoom,
  PartyKitServer,
} from "partykit/server";

export default {
  onConnect(
    conn: PartyKitConnection,
    room: PartyKitRoom,
    ctx: PartyKitContext
  ) {
    // A websocket just connected!
    console.log(
      `Connected:
  id: ${conn.id}
  room: ${room.id}
  url: ${new URL(ctx.request.url).pathname}`
    );

    // let's send a message to the connection
    conn.send("hello from server");

    // let's listen to all messages sent by the connection
    conn.addEventListener("message", (event) => {
      // let's log the message
      console.log(
        `connection ${conn.id} sent message: ${event.data as string}`
      );
      // as well as broadcast it to all
      // the other connections in the room...
      room.broadcast(
        `${conn.id}: ${event.data as string}`,
        // ...except for the connection it came from
        [conn.id]
      );
    });
  },
} satisfies PartyKitServer;
