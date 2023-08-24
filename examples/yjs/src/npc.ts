import type { Party, PartyRequest, PartyServer } from "partykit/server";

import * as Y from "yjs";
import YProvider from "y-partykit/provider";

export default class NPC implements PartyServer {
  constructor(readonly party: Party) {}

  doc: Y.Doc | undefined;
  provider: YProvider | undefined;
  awareness: YProvider["awareness"] | undefined;

  async onRequest(req: PartyRequest) {
    // POST request to this room is an invitation to connect to the party
    if (req.method === "POST") {
      if (!this.doc) {
        const host = await req.text();
        await this.onInvitation(host);
      }
    }

    return new Response("OK", { status: 200 });
  }

  async onInvitation(host: string) {
    console.log(`Received invitation from ${host}, connecting...`);

    const room = this.party.id;
    this.doc = new Y.Doc();
    this.provider = new YProvider(host, room, this.doc);
    this.awareness = this.provider.awareness;
    this.doc.on("update", this.onContentUpdate.bind(this));
    this.awareness.on("change", this.onAwarenessUpdate.bind(this));
    this.awareness.setLocalState({
      userId: this.party.id,
    });
  }

  onAwarenessUpdate() {
    const connectedPeople = this.awareness?.getStates().size;
    console.log(
      `${connectedPeople} ${connectedPeople === 1 ? "Person" : "People"} here.`
    );
  }

  onContentUpdate() {
    const message = this.doc?.getText("message");
    if (!message) {
      return;
    }

    // if the message contains the string "@npc", respond with a message
    const text = message.toJSON();
    if (text.includes("@npc")) {
      setTimeout(() => {
        const newText = `npc ${this.party.id} reporting for duty 🫡`;
        this.doc?.transact(() => {
          message.delete(0, message.length);
          message.insert(0, newText);
        });
      }, 500);
    }
  }
}
