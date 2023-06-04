/// <reference no-default-lib="true"/>
/// <reference types="@cloudflare/workers-types" />

import type { PartyKitRoom, PartyKitServer } from "partykit/server";

function broadcast(room: PartyKitRoom, msg: string) {
  for (const ws of room.connections.values()) {
    ws.socket.send(msg);
  }
}

export default {
  async onConnect(ws, room) {
    // your business logic here
    ws.send(`count:${(await room.storage.get("count")) || "0"}`);

    ws.addEventListener("message", async function incoming(evt) {
      if (evt.data === "increment") {
        await room.storage.put(
          "count",
          (parseInt(`${await room.storage.get("count")}`) || 0) + 1
        );
        broadcast(room, `count:${(await room.storage.get("count")) || "0"}`);
      } else if (evt.data === "decrement") {
        await room.storage.put(
          "count",
          (parseInt(`${await room.storage.get("count")}`) || 0) - 1
        );
        broadcast(room, `count:${(await room.storage.get("count")) || "0"}`);
      } else if ((evt.data as string).startsWith("latency")) {
        ws.send(evt.data);
      }
    });
  },
} satisfies PartyKitServer;
