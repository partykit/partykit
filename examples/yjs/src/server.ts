import type {
  Party,
  PartyConnection,
  PartyConnectionContext,
  PartyServer,
} from "partykit/server";

import { onConnect } from "y-partykit";
export default class Server implements PartyServer {
  constructor(readonly party: Party) {}

  async onConnect(connection: PartyConnection, ctx: PartyConnectionContext) {
    await onConnect(connection, this.party);

    // invite npc to connect to this party
    const host = new URL(ctx.request.url).host;
    const npc = this.party.context.parties.npc;
    void npc.get(this.party.id).fetch({ method: "POST", body: host });
  }
}
