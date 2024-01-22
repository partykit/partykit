import { enableLogs, runHandshake } from "misc/util.test";
import { assertEquals, describe, it } from "vitest";

import { Server } from "../lib/server";
import { setup } from "./setup.test";

await enableLogs();

describe("socket", () => {
  it("should keep track of rooms", () => {
    const io = new Server();

    return setup(io, 2, async (port, partialDone) => {
      io.on("connection", (socket) => {
        assertEquals(socket.rooms.size, 1);
        assertEquals(socket.rooms.has(socket.id), true);

        void socket.join("room1");

        assertEquals(socket.rooms.size, 2);
        assertEquals(socket.rooms.has("room1"), true);

        void socket.leave("room1");

        assertEquals(socket.rooms.size, 1);
        assertEquals(socket.rooms.has("room1"), false);

        void socket.join("room2");

        socket.on("disconnecting", () => {
          assertEquals(socket.rooms.has("room2"), true);

          partialDone();
        });

        socket.on("disconnect", () => {
          assertEquals(socket.rooms.size, 0);

          partialDone();
        });

        socket.disconnect();
      });

      await runHandshake(port);
    });
  });
});
