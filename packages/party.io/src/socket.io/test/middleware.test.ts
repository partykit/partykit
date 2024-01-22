import {
  eioPoll,
  eioPush,
  enableLogs,
  parseSessionID,
  runHandshake
} from "misc/util.test";
import { assertEquals, describe, it } from "vitest";

import { Server } from "../lib/server";
import { setup } from "./setup.test";

await enableLogs();

describe("event", () => {
  it("should call the middleware functions before the connection", () => {
    const io = new Server();

    return setup(io, 1, async (port, done) => {
      const result: number[] = [];

      io.use((socket) => {
        assertEquals(socket.connected, false);
        result.push(1);
        return Promise.resolve();
      });

      io.use((_) => {
        result.push(2);
        return Promise.resolve();
      });

      io.use((_) => {
        result.push(3);
        return Promise.resolve();
      });

      io.on("connection", (socket) => {
        assertEquals(socket.connected, true);
        assertEquals(result, [1, 2, 3]);

        done();
      });

      await runHandshake(port);
    });
  });

  it("should be ignored if socket gets closed", () => {
    const io = new Server();

    return setup(io, 1, async (port, done) => {
      io.use((socket) => {
        socket.client.conn.close();
        setTimeout(done, 10);
        return Promise.resolve();
      });

      io.on("connection", (_) => {
        throw "should not happen";
      });

      await runHandshake(port);
    });
  });

  it("should disallow connection", () => {
    const io = new Server();

    return setup(io, 1, async (port, done) => {
      io.use((_) => {
        throw "Authentication error";
      });

      io.use((_) => {
        throw "should not happen";
      });

      io.on("connection", (_) => {
        throw "should not happen";
      });

      const response = await fetch(
        `http://localhost:${port}/socket.io/?EIO=4&transport=polling`,
        {
          method: "get"
        }
      );

      const sid = await parseSessionID(response);

      await eioPush(port, sid, "40");
      const body = await eioPoll(port, sid);

      assertEquals(body, '44{"message":"Authentication error"}');

      done();
    });
  });

  it("should disallow connection and include an error object", () => {
    const io = new Server();

    return setup(io, 1, async (port, done) => {
      io.use((_) => {
        throw {
          message: "Authentication error",
          data: { a: "b", c: 3 }
        };
      });

      io.on("connection", (_) => {
        throw "should not happen";
      });

      const response = await fetch(
        `http://localhost:${port}/socket.io/?EIO=4&transport=polling`,
        {
          method: "get"
        }
      );

      const sid = await parseSessionID(response);

      await eioPush(port, sid, "40");
      const body = await eioPoll(port, sid);

      assertEquals(
        body,
        '44{"message":"Authentication error","data":{"a":"b","c":3}}'
      );

      done();
    });
  });

  it("should work with a custom namespace", () => {});
});
