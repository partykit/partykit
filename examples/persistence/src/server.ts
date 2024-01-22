/* eslint-disable @typescript-eslint/no-base-to-string */
import type { PartyKitServer } from "partykit/server";

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
        room.broadcast(`count:${(await room.storage.get("count")) || "0"}`);
      } else if (evt.data === "decrement") {
        await room.storage.put(
          "count",
          (parseInt(`${await room.storage.get("count")}`) || 0) - 1
        );
        room.broadcast(`count:${(await room.storage.get("count")) || "0"}`);
      } else if ((evt.data as string).startsWith("latency")) {
        ws.send(evt.data);
      }
    });
  }
} satisfies PartyKitServer;
