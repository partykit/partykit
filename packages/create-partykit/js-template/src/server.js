/* eslint-env browser */

// @ts-check
// Optional JS type checking, powered by TypeScript.
/** @typedef {import("partykit/server").Party} Party */
/** @typedef {import("partykit/server").PartyServer} PartyServer */
/** @typedef {import("partykit/server").PartyConnection} PartyConnection */
/** @typedef {import("partykit/server").PartyConnectionContext} PartyConnectionContext */

/**
 * @implements {PartyServer}
 */
class Server {
  constructor(party) {
    /** @type {Party} */
    this.party = party;
  }

  /**
   * @param {PartyConnection} conn - The connection object.
   * @param {PartyConnectionContext} ctx - The context object.
   */
  onConnect(conn, ctx) {
    // A websocket just connected!
    console.log(
      `Connected:
  id: ${conn.id}
  room: ${this.party.id}
  url: ${new URL(ctx.request.url).pathname}`
    );

    // Send a message to the connection
    conn.send("hello from server");
  }

  /**
   * @param {string} message
   * @param {PartyConnection} sender
   */
  onMessage(message, sender) {
    console.log(`connection ${sender.id} sent message: ${message}`);
    // Broadcast the received message to all other connections in the room except the sender
    this.party.broadcast(`${sender.id}: ${message}`, [sender.id]);
  }
}

export default Server;
