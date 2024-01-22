import { enableLogs, parseSessionID } from "misc/util.test";
import { assertEquals, assertInstanceOf, describe, it } from "vitest";

import { Server } from "../lib/server";
import { setup } from "./setup.test";

await enableLogs();

describe("messages", () => {
  it("should arrive from server to client (polling, plain-text)", () => {
    const engine = new Server();

    return setup(engine, 1, async (port, done) => {
      engine.on("connection", (socket) => {
        socket.send("hello €亜Б");
      });

      const response = await fetch(
        `http://localhost:${port}/engine.io/?EIO=4&transport=polling`,
        {
          method: "get"
        }
      );

      const sid = await parseSessionID(response);

      const pollResponse = await fetch(
        `http://localhost:${port}/engine.io/?EIO=4&transport=polling&sid=${sid}`,
        {
          method: "get"
        }
      );

      assertEquals(pollResponse.status, 200);

      const body = await pollResponse.text();

      assertEquals(body, "4hello €亜Б");

      done();
    });
  });

  it("should arrive from server to client (polling, binary)", () => {
    const engine = new Server();

    return setup(engine, 1, async (port, done) => {
      engine.on("connection", (socket) => {
        socket.send(Uint8Array.from([1, 2, 3, 4]));
      });

      const response = await fetch(
        `http://localhost:${port}/engine.io/?EIO=4&transport=polling`,
        {
          method: "get"
        }
      );

      const sid = await parseSessionID(response);

      const pollResponse = await fetch(
        `http://localhost:${port}/engine.io/?EIO=4&transport=polling&sid=${sid}`,
        {
          method: "get"
        }
      );

      assertEquals(pollResponse.status, 200);

      const body = await pollResponse.text();

      assertEquals(body, "bAQIDBA==");

      done();
    });
  });

  it("should arrive from server to client (polling, mixed)", () => {
    const engine = new Server();

    return setup(engine, 1, async (port, done) => {
      engine.on("connection", (socket) => {
        socket.send(Uint8Array.from([1, 2, 3, 4]));
        socket.send("hello €亜Б");
      });

      const response = await fetch(
        `http://localhost:${port}/engine.io/?EIO=4&transport=polling`,
        {
          method: "get"
        }
      );

      const sid = await parseSessionID(response);

      const pollResponse = await fetch(
        `http://localhost:${port}/engine.io/?EIO=4&transport=polling&sid=${sid}`,
        {
          method: "get"
        }
      );

      assertEquals(pollResponse.status, 200);

      const body = await pollResponse.text();

      assertEquals(body, "bAQIDBA==\x1e4hello €亜Б");

      done();
    });
  });

  it("should arrive from server to client (ws, plain-text)", () => {
    const engine = new Server();

    return setup(engine, 1, (port, done) => {
      engine.on("connection", (socket) => {
        socket.send("hello €亜Б");
      });

      const socket = new WebSocket(
        `ws://localhost:${port}/engine.io/?EIO=4&transport=websocket`
      );

      socket.onmessage = ({ data }) => {
        if (typeof data === "string" && data[0] === "0") {
          // ignore handshake
          return;
        }

        assertEquals(data, "4hello €亜Б");

        done();
      };
    });
  });

  it("should arrive from server to client (ws, binary)", () => {
    const engine = new Server();

    return setup(engine, 1, (port, done) => {
      engine.on("connection", (socket) => {
        socket.send(Uint8Array.from([1, 2, 3, 4]));
      });

      const socket = new WebSocket(
        `ws://localhost:${port}/engine.io/?EIO=4&transport=websocket`
      );

      socket.binaryType = "arraybuffer";

      socket.onmessage = ({ data }) => {
        if (typeof data === "string" && data[0] === "0") {
          // ignore handshake
          return;
        }

        assertEquals(new Uint8Array(data), Uint8Array.from([1, 2, 3, 4]));

        done();
      };
    });
  });

  it("should arrive from client to server (polling, plain-text)", () => {
    const engine = new Server();

    return setup(engine, 2, async (port, partialDone) => {
      engine.on("connection", (socket) => {
        socket.on("message", (val) => {
          assertEquals(val, "hello €亜Б");
          partialDone();
        });
      });

      const response = await fetch(
        `http://localhost:${port}/engine.io/?EIO=4&transport=polling`,
        {
          method: "get"
        }
      );

      const sid = await parseSessionID(response);

      const dataResponse = await fetch(
        `http://localhost:${port}/engine.io/?EIO=4&transport=polling&sid=${sid}`,
        {
          method: "post",
          body: "4hello €亜Б"
        }
      );

      // consume the response body
      await dataResponse.body?.cancel();

      partialDone();
    });
  });

  it("should arrive from client to server (polling, binary)", () => {
    const engine = new Server();

    return setup(engine, 2, async (port, partialDone) => {
      engine.on("connection", (socket) => {
        socket.on("message", (val) => {
          assertInstanceOf(val, ArrayBuffer);
          assertEquals(new Uint8Array(val), Uint8Array.from([1, 2, 3, 4]));

          partialDone();
        });
      });

      const response = await fetch(
        `http://localhost:${port}/engine.io/?EIO=4&transport=polling`,
        {
          method: "get"
        }
      );

      const sid = await parseSessionID(response);

      const dataResponse = await fetch(
        `http://localhost:${port}/engine.io/?EIO=4&transport=polling&sid=${sid}`,
        {
          method: "post",
          body: "bAQIDBA=="
        }
      );

      // consume the response body
      await dataResponse.body?.cancel();

      partialDone();
    });
  });

  it("should arrive from client to server (polling, mixed)", () => {
    const engine = new Server();

    return setup(engine, 3, async (port, partialDone) => {
      engine.on("connection", (socket) => {
        let count = 0;

        socket.on("message", (val) => {
          if (++count === 1) {
            assertInstanceOf(val, ArrayBuffer);
            assertEquals(new Uint8Array(val), Uint8Array.from([1, 2, 3, 4]));
          } else {
            assertEquals(val, "hello €亜Б");
          }
          partialDone();
        });
      });

      const response = await fetch(
        `http://localhost:${port}/engine.io/?EIO=4&transport=polling`,
        {
          method: "get"
        }
      );

      const sid = await parseSessionID(response);

      const dataResponse = await fetch(
        `http://localhost:${port}/engine.io/?EIO=4&transport=polling&sid=${sid}`,
        {
          method: "post",
          body: "bAQIDBA==\x1e4hello €亜Б"
        }
      );

      // consume the response body
      await dataResponse.body?.cancel();

      partialDone();
    });
  });

  it("should arrive from client to server (ws, plain-text)", () => {
    const engine = new Server();

    return setup(engine, 1, (port, done) => {
      engine.on("connection", (socket) => {
        socket.on("message", (val) => {
          assertEquals(val, "hello €亜Б");
          done();
        });
      });

      const socket = new WebSocket(
        `ws://localhost:${port}/engine.io/?EIO=4&transport=websocket`
      );

      socket.onmessage = () => {
        socket.send("4hello €亜Б");
      };
    });
  });

  it("should arrive from client to server (ws, binary)", () => {
    const engine = new Server();

    return setup(engine, 1, (port, done) => {
      engine.on("connection", (socket) => {
        socket.on("message", (val) => {
          assertInstanceOf(val, ArrayBuffer);
          assertEquals(new Uint8Array(val), Uint8Array.from([1, 2, 3, 4]));

          done();
        });
      });

      const socket = new WebSocket(
        `ws://localhost:${port}/engine.io/?EIO=4&transport=websocket`
      );

      socket.binaryType = "arraybuffer";

      socket.onmessage = () => {
        socket.send(Uint8Array.from([1, 2, 3, 4]));
      };
    });
  });
});
