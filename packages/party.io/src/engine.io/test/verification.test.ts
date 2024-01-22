import { enableLogs } from "misc/util.test";
import { assertEquals, assertExists, describe, it } from "vitest";

import { Server } from "../lib/server";
import { setup } from "./setup.test";

await enableLogs();

describe("verification", () => {
  it("should ignore requests that do not match the given path", () => {
    const engine = new Server();

    return setup(engine, 1, async (port, done) => {
      const response = await fetch(`http://localhost:${port}/test/`, {
        method: "get"
      });

      assertEquals(response.status, 404);

      // consume the response body
      await response.body?.cancel();

      done();
    });
  });

  it("should disallow non-existent transports", () => {
    const engine = new Server();

    return setup(engine, 2, async (port, partialDone) => {
      engine.on("connection_error", (err) => {
        assertEquals(err.code, 0);
        assertEquals(err.message, "Transport unknown");
        assertEquals(err.context.transport, "tobi");

        partialDone();
      });

      const response = await fetch(
        `http://localhost:${port}/engine.io/?transport=tobi`,
        {
          method: "get"
        }
      );

      assertEquals(response.status, 400);

      const body = await response.json();
      assertEquals(body.code, 0);
      assertEquals(body.message, "Transport unknown");

      partialDone();
    });
  });

  it("should disallow `constructor` as transports", () => {
    const engine = new Server();

    return setup(engine, 2, async (port, partialDone) => {
      engine.on("connection_error", (err) => {
        assertEquals(err.code, 0);
        assertEquals(err.message, "Transport unknown");
        assertEquals(err.context.transport, "constructor");

        partialDone();
      });

      const response = await fetch(
        `http://localhost:${port}/engine.io/?transport=constructor`,
        {
          method: "get"
        }
      );

      assertEquals(response.status, 400);

      const body = await response.json();
      assertEquals(body.code, 0);
      assertEquals(body.message, "Transport unknown");

      partialDone();
    });
  });

  it("should disallow non-existent sids", () => {
    const engine = new Server();

    return setup(engine, 2, async (port, partialDone) => {
      engine.on("connection_error", (err) => {
        assertEquals(err.code, 1);
        assertEquals(err.message, "Session ID unknown");
        assertEquals(err.context.sid, "test");

        partialDone();
      });

      const response = await fetch(
        `http://localhost:${port}/engine.io/?transport=polling&sid=test`,
        {
          method: "get"
        }
      );

      assertEquals(response.status, 400);

      const body = await response.json();
      assertEquals(body.code, 1);
      assertEquals(body.message, "Session ID unknown");

      partialDone();
    });
  });

  it("should disallow requests that are rejected by `allowRequest` (polling)", () => {
    const engine = new Server({
      allowRequest: () => {
        return Promise.reject("Thou shall not pass");
      }
    });

    return setup(engine, 2, async (port, partialDone) => {
      engine.on("connection_error", (err) => {
        assertExists(err.req);
        assertEquals(err.code, 4);
        assertEquals(err.message, "Forbidden");
        assertEquals(err.context.message, "Thou shall not pass");

        partialDone();
      });

      const response = await fetch(
        `http://localhost:${port}/engine.io/?EIO=4&transport=polling`,
        {
          method: "get"
        }
      );

      assertEquals(response.status, 403);

      const body = await response.json();
      assertEquals(body.code, 4);
      assertEquals(body.message, "Thou shall not pass");

      partialDone();
    });
  });

  it("should disallow requests that are rejected by `allowRequest` (ws)", () => {
    const engine = new Server({
      allowRequest: () => {
        return Promise.reject("Thou shall not pass");
      }
    });

    return setup(engine, 2, (port, partialDone) => {
      engine.on("connection_error", (err) => {
        assertExists(err.req);
        assertEquals(err.code, 4);
        assertEquals(err.message, "Forbidden");
        assertEquals(err.context.message, "Thou shall not pass");

        partialDone();
      });

      const socket = new WebSocket(
        `ws://localhost:${port}/engine.io/?EIO=4&transport=websocket`
      );

      socket.onclose = partialDone;
    });
  });

  it("should disallow invalid handshake method", () => {
    const engine = new Server();

    return setup(engine, 2, async (port, partialDone) => {
      engine.on("connection_error", (err) => {
        assertExists(err.req);
        assertEquals(err.code, 2);
        assertEquals(err.message, "Bad handshake method");
        assertEquals(err.context.method, "PUT");

        partialDone();
      });

      const response = await fetch(
        `http://localhost:${port}/engine.io/?transport=polling`,
        {
          method: "put"
        }
      );

      assertEquals(response.status, 400);

      const body = await response.json();
      assertEquals(body.code, 2);
      assertEquals(body.message, "Bad handshake method");

      partialDone();
    });
  });

  it("should disallow unsupported protocol versions", () => {
    const engine = new Server();

    return setup(engine, 2, async (port, partialDone) => {
      engine.on("connection_error", (err) => {
        assertExists(err.req);
        assertEquals(err.code, 5);
        assertEquals(err.message, "Unsupported protocol version");
        assertEquals(err.context.protocol, 3);

        partialDone();
      });

      const response = await fetch(
        `http://localhost:${port}/engine.io/?EIO=3&transport=polling`,
        {
          method: "get"
        }
      );

      assertEquals(response.status, 400);

      const body = await response.json();
      assertEquals(body.code, 5);
      assertEquals(body.message, "Unsupported protocol version");

      partialDone();
    });
  });

  it("should disallow invalid transport", () => {
    const engine = new Server();

    return setup(engine, 2, (port, partialDone) => {
      engine.on("connection_error", (err) => {
        assertExists(err.req);
        assertEquals(err.code, 3);
        assertEquals(err.message, "Bad request");
        assertEquals(err.context.name, "TRANSPORT_MISMATCH");
        assertEquals(err.context.transport, "polling");
        assertEquals(err.context.previousTransport, "websocket");

        partialDone();
      });

      const socket = new WebSocket(
        `ws://localhost:${port}/engine.io/?EIO=4&transport=websocket`
      );

      socket.onmessage = async ({ data }) => {
        const handshake = JSON.parse(data.substring(1));

        const response = await fetch(
          `http://localhost:${port}/engine.io/?EIO=3&transport=polling&sid=${handshake.sid}`,
          {
            method: "get"
          }
        );

        assertEquals(response.status, 400);

        const body = await response.json();
        assertEquals(body.code, 3);
        assertEquals(body.message, "Bad request");

        partialDone();
      };
    });
  });

  it("should disallow duplicate WebSocket connections", () => {
    const engine = new Server();

    return setup(engine, 1, (port, done) => {
      const socket = new WebSocket(
        `ws://localhost:${port}/engine.io/?EIO=4&transport=websocket`
      );

      socket.onmessage = ({ data }) => {
        const handshake = JSON.parse(data.substring(1));

        const socket = new WebSocket(
          `ws://localhost:${port}/engine.io/?EIO=4&transport=websocket&sid=${handshake.sid}`
        );

        socket.onclose = done;
      };
    });
  });
});
