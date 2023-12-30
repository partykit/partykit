/* eslint-env browser */

// @ts-check
// Optional JS type checking, powered by TypeScript.
/** @typedef {import("partykit/server").Room} Room */
/** @typedef {import("partykit/server").Server} Server */
/** @typedef {import("partykit/server").Connection} Connection */
/** @typedef {import("partykit/server").ConnectionContext} ConnectionContext */

/**
 * @implements {Server}
 */
class PartyServer {
  /**
   * @param {Room} room - The Room object.
   */
  constructor(room) {
    /** @type {Room} */
    this.room = room;
  }

  /**
   * @param {Connection} conn - The connection object.
   * @param {ConnectionContext} ctx - The context object.
   */
  onConnect(conn, ctx) {
    // A websocket just connected!
    console.log(
      `Connected:
  id: ${conn.id}
  room: ${this.room.id}
  url: ${new URL(ctx.request.url).pathname}`
    );

    // Send a message to the connection
    conn.send("hello from server");
  }

  /**
   * @param {string} message
   * @param {Connection} sender
   */
  onMessage(message, sender) {
    console.log(`connection ${sender.id} sent message: ${message}`);
    // Broadcast the received message to all other connections in the room except the sender
    this.room.broadcast(`${sender.id}: ${message}`, [sender.id]);
  }
}

export default PartyServer;
