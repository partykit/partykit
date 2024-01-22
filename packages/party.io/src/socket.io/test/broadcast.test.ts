import { eioPoll, enableLogs, runHandshake, waitFor } from "misc/util.test";
import { assertEquals, describe, it } from "vitest";

import { Server } from "../lib/server";
import { setup } from "./setup.test";

import type { Socket } from "../lib/socket";

await enableLogs();

describe("broadcast", () => {
  it("should emit to all sockets", () => {
    const io = new Server({
      pingInterval: 50
    });

    return setup(io, 1, async (port, done) => {
      io.of("/custom");

      const [sid1] = await runHandshake(port);
      const [sid2] = await runHandshake(port);
      const [sid3] = await runHandshake(port, "/custom");

      io.of("/").emit("foo", "bar");

      const [body1, body2, body3] = await Promise.all([
        eioPoll(port, sid1),
        eioPoll(port, sid2),
        eioPoll(port, sid3)
      ]);

      assertEquals(body1, '42["foo","bar"]');
      assertEquals(body2, '42["foo","bar"]');
      assertEquals(body3, "2");

      // drain buffer
      await eioPoll(port, sid1);
      await eioPoll(port, sid2);

      done();
    });
  });

  it("should emit to all sockets in a room", () => {
    const io = new Server({
      pingInterval: 50
    });

    return setup(io, 1, async (port, done) => {
      io.of("/custom");

      io.once("connection", (socket) => {
        void socket.join("room1");
      });

      const [sid1] = await runHandshake(port);
      const [sid2] = await runHandshake(port);
      const [sid3] = await runHandshake(port, "/custom");

      io.to("room1").emit("foo", "bar");

      const [body1, body2, body3] = await Promise.all([
        eioPoll(port, sid1),
        eioPoll(port, sid2),
        eioPoll(port, sid3)
      ]);

      assertEquals(body1, '42["foo","bar"]');
      assertEquals(body2, "2");
      assertEquals(body3, "2");

      // drain buffer
      await eioPoll(port, sid1);

      done();
    });
  });

  it("should emit to all sockets in a room excluding a given socket", () => {
    const io = new Server({
      pingInterval: 50
    });

    return setup(io, 1, async (port, done) => {
      const namespace = io.of("/custom");

      const [[sid1], socket1] = await Promise.all([
        runHandshake(port),
        waitFor<Socket>(io, "connection")
      ]);
      const [[sid2], socket2] = await Promise.all([
        runHandshake(port),
        waitFor<Socket>(io, "connection")
      ]);
      const [[sid3], socket3] = await Promise.all([
        runHandshake(port, "/custom"),
        waitFor<Socket>(namespace, "connection")
      ]);

      socket1.join("room1");
      socket2.join("room1");
      socket3.join("room1");

      socket1.to("room1").emit("foo", "bar");

      const [body1, body2, body3] = await Promise.all([
        eioPoll(port, sid1),
        eioPoll(port, sid2),
        eioPoll(port, sid3)
      ]);

      assertEquals(body1, "2");
      assertEquals(body2, '42["foo","bar"]');
      assertEquals(body3, "2");

      // drain buffer
      await eioPoll(port, sid2);

      done();
    });
  });
});
