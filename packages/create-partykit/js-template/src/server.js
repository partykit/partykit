/* eslint-env browser */
/** @typedef {import("partykit/server")} PK */

/**
 * The server object that satisfies the PartyKitServer interface.
 * @type {PK.PartyKitServer}
 */
const server = {
  /**
   * Handler for when a connection is established.
   *
   * @param {PK.PartyKitConnection} conn - The connection object.
   * @param {PK.PartyKitRoom} room - The room object.
   * @param {PK.PartyKitContext} ctx - The context object.
   */
  onConnect(conn, room, ctx) {
    // A websocket just connected!
    console.log(
      `Connected:
  id: ${conn.id}
  room: ${room.id}
  url: ${new URL(ctx.request.url).pathname}`
    );

    // Send a message to the connection
    conn.send("hello from server");

    /**
     * Event listener for when a message is received from the connection.
     *
     * @param {Event} event - The message event.
     */
    conn.addEventListener("message", function (event) {
      // Log the received message
      console.log(`connection ${conn.id} sent message: ${event.data}`);

      // Broadcast the received message to all other connections in the room except the sender
      room.broadcast(`${conn.id}: ${event.data}`, [conn.id]);
    });
  },
};

export default server;
