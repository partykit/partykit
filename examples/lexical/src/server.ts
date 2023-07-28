import type { PartyKitServer } from "partykit/server";
import { onConnect } from "y-partykit";

export default {
  async onConnect(ws, room) {
    return onConnect(ws, room, { persist: true });
  },
} satisfies PartyKitServer;
