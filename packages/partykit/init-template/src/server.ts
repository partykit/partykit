import type {
  PartyKitConnection,
  PartyKitRoom,
  PartyKitServer,
} from "partykit/server";

export default {
  onConnect(conn: PartyKitConnection, room: PartyKitRoom) {
    // let's log the connection id and room id
    console.log(`connection ${conn.id} connected to room ${room.id}`);

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
