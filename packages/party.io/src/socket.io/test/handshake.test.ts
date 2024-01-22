import {
  eioPoll,
  eioPush,
  enableLogs,
  parseSessionID,
  runHandshake
} from "misc/util.test";
import { assertEquals, assertExists, describe, it } from "vitest";

import { Server } from "../lib/server";
import { setup } from "./setup.test";

await enableLogs();

describe("handshake", () => {
  it("should trigger a connection event", () => {
    const io = new Server();

    return setup(io, 2, async (port, partialDone) => {
      io.on("connection", (socket) => {
        assertExists(socket.id);
        assertEquals(socket.handshake.address, "127.0.0.1");
        assertEquals(socket.handshake.auth, {});
        assertEquals(socket.handshake.xdomain, false);
        assertEquals(socket.handshake.secure, false); // always false
        assertEquals(socket.handshake.query.get("EIO"), "4");
        assertEquals(socket.handshake.query.get("transport"), "polling");
        assertEquals(socket.handshake.url, "/socket.io/");

        partialDone();
      });

      const response = await fetch(
        `http://localhost:${port}/socket.io/?EIO=4&transport=polling`,
        {
          method: "get"
        }
      );

      assertEquals(response.status, 200);

      const sid = await parseSessionID(response);

      const dataResponse = await fetch(
        `http://localhost:${port}/socket.io/?EIO=4&transport=polling&sid=${sid}`,
        {
          method: "post",
          body: "40"
        }
      );

      assertEquals(dataResponse.status, 200);

      // consume the response body
      await dataResponse.body?.cancel();

      const pollResponse = await fetch(
        `http://localhost:${port}/socket.io/?EIO=4&transport=polling&sid=${sid}`,
        {
          method: "get"
        }
      );

      assertEquals(pollResponse.status, 200);

      const body = await pollResponse.text();

      assertEquals(body[0], "4"); // Engine.IO MESSAGE packet type
      assertEquals(body[1], "0"); // Socket.IO CONNECT packet type

      const handshake = JSON.parse(body.substring(2));
      assertExists(handshake.sid);

      partialDone();
    });
  });

  it("should trigger a connection event with custom auth payload, header and query parameter", () => {
    const server = new Server();

    return setup(server, 2, async (port, partialDone) => {
      server.on("connection", (socket) => {
        assertExists(socket.id);
        assertEquals(socket.handshake.query.get("foo"), "123");
        assertEquals(socket.handshake.headers.get("bar"), "456");
        assertEquals(socket.handshake.auth, {
          foobar: "789"
        });

        partialDone();
      });

      const response = await fetch(
        `http://localhost:${port}/socket.io/?EIO=4&transport=polling&foo=123`,
        {
          method: "get",
          headers: {
            bar: "456"
          }
        }
      );

      assertEquals(response.status, 200);

      const sid = await parseSessionID(response);

      const dataResponse = await fetch(
        `http://localhost:${port}/socket.io/?EIO=4&transport=polling&sid=${sid}`,
        {
          method: "post",
          body: '40{"foobar":"789"}'
        }
      );

      assertEquals(dataResponse.status, 200);

      // consume the response body
      await dataResponse.body?.cancel();

      const pollResponse = await fetch(
        `http://localhost:${port}/socket.io/?EIO=4&transport=polling&sid=${sid}`,
        {
          method: "get"
        }
      );

      assertEquals(pollResponse.status, 200);

      // consume the response body
      await pollResponse.body?.cancel();

      partialDone();
    });
  });

  it("should trigger a connection event (custom namespace)", () => {
    const io = new Server();

    return setup(io, 2, async (port, partialDone) => {
      io.of("/custom").on("connection", (socket) => {
        assertExists(socket.id);
        partialDone();
      });

      const response = await fetch(
        `http://localhost:${port}/socket.io/?EIO=4&transport=polling`,
        {
          method: "get"
        }
      );

      assertEquals(response.status, 200);

      const sid = await parseSessionID(response);

      await eioPush(port, sid, "40/custom,");

      const body = await eioPoll(port, sid);
      assertEquals(body.startsWith("40/custom,{"), true);

      partialDone();
    });
  });

  it("should trigger a connection event (dynamic namespace)", () => {
    const io = new Server();

    return setup(io, 2, async (port, partialDone) => {
      io.of(/^\/dynamic-\d+$/).on("connection", (socket) => {
        assertExists(socket.id);
        partialDone();
      });

      const response = await fetch(
        `http://localhost:${port}/socket.io/?EIO=4&transport=polling`,
        {
          method: "get"
        }
      );

      assertEquals(response.status, 200);

      const sid = await parseSessionID(response);

      await eioPush(port, sid, "40/dynamic-101,");

      const body = await eioPoll(port, sid);
      assertEquals(body.startsWith("40/dynamic-101,{"), true);

      partialDone();
    });
  });

  it("should return an error when reaching a non-existent namespace", () => {
    const io = new Server();

    return setup(io, 1, async (port, done) => {
      const response = await fetch(
        `http://localhost:${port}/socket.io/?EIO=4&transport=polling`,
        {
          method: "get"
        }
      );

      const sid = await parseSessionID(response);

      await eioPush(port, sid, "40/unknown,");

      const body = await eioPoll(port, sid);

      assertEquals(body, '44/unknown,{"message":"Invalid namespace"}');

      done();
    });
  });

  it("should complete handshake before sending any event", () => {
    const io = new Server();

    return setup(io, 1, async (port, done) => {
      io.use((socket) => {
        socket.emit("1");
        io.emit("ignored"); // socket is not connected yet
        return Promise.resolve();
      });

      io.on("connection", (socket) => {
        socket.emit("2");
      });

      const [_, firstPacket] = await runHandshake(port);

      assertEquals(firstPacket, '42["1"]\x1e42["2"]');

      done();
    });
  });
});
