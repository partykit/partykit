import { eioPoll, eioPush, enableLogs, runHandshake } from "misc/util.test";
import { assertEquals, assertIsError, describe, it } from "vitest";

import { Server } from "../lib/server";
import { setup } from "./setup.test";

await enableLogs();

describe("event", () => {
  it("should receive events", () => {
    const io = new Server();

    return setup(io, 2, async (port, partialDone) => {
      io.on("connection", (socket) => {
        socket.on("random", (a, b, c) => {
          assertEquals(a, 1);
          assertEquals(b, "2");
          assertEquals(c, [3]);

          partialDone();
        });
      });

      const [sid] = await runHandshake(port);

      await eioPush(port, sid, '42["random",1,"2",[3]]');

      partialDone();
    });
  });

  it("should emit events", () => {
    const io = new Server();

    return setup(io, 2, async (port, partialDone) => {
      io.on("connection", (socket) => {
        socket.emit("random", 4, "5", [6]);

        partialDone();
      });

      const [_, firstPacket] = await runHandshake(port);
      assertEquals(firstPacket, '42["random",4,"5",[6]]');

      partialDone();
    });
  });

  it("should receive events with ack", () => {
    const io = new Server();

    return setup(io, 2, async (port, partialDone) => {
      io.on("connection", (socket) => {
        socket.on("random", (a, b, c, callback) => {
          assertEquals(a, 1);
          assertEquals(b, "2");
          assertEquals(c, [3]);
          callback("foo", 123);

          partialDone();
        });
      });

      const [sid] = await runHandshake(port);

      await eioPush(port, sid, '421["random",1,"2",[3]]');

      const body = await eioPoll(port, sid);
      assertEquals(body, '431["foo",123]');

      partialDone();
    });
  });

  it("should emit events with ack", () => {
    const io = new Server();

    return setup(io, 2, async (port, partialDone) => {
      io.on("connection", (socket) => {
        socket.emit("random", 4, "5", [6], (a: string, b: number) => {
          assertEquals(a, "bar");
          assertEquals(b, 456);

          partialDone();
        });
      });

      const [sid, firstPacket] = await runHandshake(port);
      assertEquals(firstPacket, '420["random",4,"5",[6]]');
      await eioPush(port, sid, '430["bar",456]');

      partialDone();
    });
  });

  it("should timeout if the client does not acknowledge the event", () => {
    const io = new Server();

    return setup(io, 1, async (port, done) => {
      io.on("connection", (socket) => {
        socket.timeout(0).emit("unknown", (err: Error) => {
          assertIsError(err);

          setTimeout(done, 10);
        });
      });

      await runHandshake(port);
    });
  });

  it("should timeout if the client does not acknowledge the event in time", () => {
    const io = new Server();

    return setup(io, 1, async (port, done) => {
      io.on("connection", (socket) => {
        socket.timeout(0).emit("echo", 42, (err: Error) => {
          assertIsError(err);

          setTimeout(done, 10);
        });
      });

      const [sid] = await runHandshake(port);
      await eioPush(port, sid, "430[]");
    });
  });

  it("should not timeout if the client does acknowledge the event", () => {
    const io = new Server();

    return setup(io, 2, async (port, partialDone) => {
      io.on("connection", (socket) => {
        socket.timeout(50).emit("echo", (err: Error, val: number) => {
          assertEquals(err, null);
          assertEquals(val, 42);

          partialDone();
        });
      });

      const [sid] = await runHandshake(port);
      await eioPush(port, sid, "430[42]");

      partialDone();
    });
  });
});
