import { enableLogs } from "misc/util.test";
import { assertEquals, assertExists, describe, it } from "vitest";

import { Server } from "../lib/server";
import { setup } from "./setup.test";

await enableLogs();

describe("handshake", () => {
  it("should send handshake data (polling)", () => {
    const engine = new Server();

    return setup(engine, 1, async (port, done) => {
      const response = await fetch(
        `http://localhost:${port}/engine.io/?EIO=4&transport=polling`,
        {
          method: "get"
        }
      );

      assertEquals(response.status, 200);

      const body = await response.text();
      assertEquals(body[0], "0");

      const handshake = JSON.parse(body.substring(1));
      assertExists(handshake.sid);
      assertEquals(handshake.pingTimeout, 20000);
      assertEquals(handshake.pingInterval, 25000);
      assertEquals(handshake.upgrades, ["websocket"]);
      assertEquals(handshake.maxPayload, 1000000);

      done();
    });
  });

  it("should send handshake data with custom values (polling)", () => {
    const engine = new Server({
      pingInterval: 100,
      pingTimeout: 200,
      maxHttpBufferSize: 300
    });

    return setup(engine, 1, async (port, done) => {
      const response = await fetch(
        `http://localhost:${port}/engine.io/?EIO=4&transport=polling`,
        {
          method: "get"
        }
      );

      assertEquals(response.status, 200);

      const body = await response.text();
      assertEquals(body[0], "0");

      const handshake = JSON.parse(body.substring(1));
      assertExists(handshake.sid);
      assertEquals(handshake.pingInterval, 100);
      assertEquals(handshake.pingTimeout, 200);
      assertEquals(handshake.maxPayload, 300);

      done();
    });
  });

  it("should send handshake data (ws)", () => {
    const engine = new Server();

    return setup(engine, 1, (port, done) => {
      const socket = new WebSocket(
        `ws://localhost:${port}/engine.io/?EIO=4&transport=websocket`
      );

      socket.onmessage = (event) => {
        assertEquals(event.data[0], "0");

        const handshake = JSON.parse(event.data.substring(1));
        assertExists(handshake.sid);
        assertEquals(handshake.pingTimeout, 20000);
        assertEquals(handshake.pingInterval, 25000);
        assertEquals(handshake.upgrades, []);
        assertEquals(handshake.maxPayload, 1000000);

        socket.close();
        done();
      };
    });
  });

  it("should trigger a connection event", () => {
    const engine = new Server();

    return setup(engine, 2, async (port, partialDone) => {
      engine.on("connection", (socket) => {
        assertExists(socket.id);
        assertEquals(socket.transport.name, "polling");

        partialDone();
      });

      const response = await fetch(
        `http://localhost:${port}/engine.io/?EIO=4&transport=polling`,
        {
          method: "get"
        }
      );

      assertEquals(response.status, 200);

      // consume the response body
      await response.body?.cancel();

      partialDone();
    });
  });
});
