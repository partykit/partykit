import { enableLogs, parseSessionID, sleep } from "misc/util.test";
import { assertEquals, describe, it } from "vitest";

import { Server } from "../lib/server";
import { setup } from "./setup.test";

await enableLogs();

describe("close", () => {
  it("should trigger upon ping timeout (polling)", () => {
    const engine = new Server({
      pingInterval: 5,
      pingTimeout: 5
    });

    return setup(engine, 2, async (port, partialDone) => {
      engine.on("connection", (socket) => {
        socket.on("close", (reason) => {
          assertEquals(reason, "ping timeout");

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

      await sleep(10);

      const pollResponse = await fetch(
        `http://localhost:${port}/engine.io/?EIO=4&transport=polling&sid=${sid}`,
        {
          method: "get"
        }
      );

      assertEquals(pollResponse.status, 400);

      // consume the response body
      await pollResponse.body?.cancel();

      partialDone();
    });
  });

  it("should trigger upon ping timeout (ws)", () => {
    const engine = new Server({
      pingInterval: 5,
      pingTimeout: 5
    });

    return setup(engine, 2, (port, partialDone) => {
      engine.on("connection", (socket) => {
        socket.on("close", (reason) => {
          assertEquals(reason, "ping timeout");

          partialDone();
        });
      });

      const socket = new WebSocket(
        `ws://localhost:${port}/engine.io/?EIO=4&transport=websocket`
      );

      socket.onclose = partialDone;
    });
  });

  it("should trigger when the server closes the socket (polling)", () => {
    const engine = new Server();

    return setup(engine, 2, async (port, partialDone) => {
      engine.on("connection", (socket) => {
        socket.on("close", (reason) => {
          assertEquals(reason, "forced close");

          partialDone();
        });

        setTimeout(() => socket.close(), 10);
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

      assertEquals(body, "1");

      partialDone();
    });
  });

  it("should trigger when the server closes the socket (ws)", () => {
    const engine = new Server();

    return setup(engine, 2, (port, partialDone) => {
      engine.on("connection", (socket) => {
        socket.on("close", (reason) => {
          assertEquals(reason, "forced close");

          partialDone();
        });

        socket.close();
      });

      const socket = new WebSocket(
        `ws://localhost:${port}/engine.io/?EIO=4&transport=websocket`
      );

      socket.onopen = () => {
        socket.onclose = partialDone;
      };
    });
  });

  it("should trigger when the client sends a 'close' packet (polling)", () => {
    const engine = new Server();

    return setup(engine, 2, async (port, partialDone) => {
      engine.on("connection", (socket) => {
        socket.on("close", (reason) => {
          assertEquals(reason, "transport close");

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

      const [pollResponse, dataResponse] = await Promise.all([
        fetch(
          `http://localhost:${port}/engine.io/?EIO=4&transport=polling&sid=${sid}`
        ),
        fetch(
          `http://localhost:${port}/engine.io/?EIO=4&transport=polling&sid=${sid}`,
          {
            method: "post",
            body: "1"
          }
        )
      ]);

      assertEquals(pollResponse.status, 200);
      assertEquals(await pollResponse.text(), "6");

      assertEquals(dataResponse.status, 200);
      assertEquals(await dataResponse.text(), "ok");

      partialDone();
    });
  });

  it("should trigger when the client sends a 'close' packet (ws)", () => {
    const engine = new Server();

    return setup(engine, 2, (port, partialDone) => {
      engine.on("connection", (socket) => {
        socket.on("close", (reason) => {
          assertEquals(reason, "transport close");

          partialDone();
        });
      });

      const socket = new WebSocket(
        `ws://localhost:${port}/engine.io/?EIO=4&transport=websocket`
      );

      socket.onmessage = () => {
        socket.send("1");
        socket.onclose = partialDone;
      };
    });
  });

  it.ignore(
    "should trigger when the client closes the connection (polling)",
    () => {
      // TODO
    }
  );

  it("should trigger when the client closes the connection (ws)", () => {
    const engine = new Server();

    return setup(engine, 2, (port, partialDone) => {
      engine.on("connection", (socket) => {
        socket.on("close", (reason) => {
          assertEquals(reason, "transport close");
          partialDone();
        });
      });

      const socket = new WebSocket(
        `ws://localhost:${port}/engine.io/?EIO=4&transport=websocket`
      );

      socket.onmessage = () => {
        socket.close();
        partialDone();
      };
    });
  });

  it("should trigger when the client sends ill-formatted data", () => {
    const engine = new Server();

    return setup(engine, 2, async (port, partialDone) => {
      engine.on("connection", (socket) => {
        socket.on("close", (reason) => {
          assertEquals(reason, "parse error");

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
          body: "abc"
        }
      );

      assertEquals(dataResponse.status, 200);

      const body = await dataResponse.text();

      assertEquals(body, "ok");

      partialDone();
    });
  });

  it("should trigger when the client sends a payload bigger than maxHttpBufferSize (polling)", () => {
    const engine = new Server({
      maxHttpBufferSize: 100
    });

    return setup(engine, 2, async (port, partialDone) => {
      engine.on("connection", (socket) => {
        socket.on("close", (reason) => {
          assertEquals(reason, "transport error");

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
          body: "a".repeat(101)
        }
      );

      assertEquals(dataResponse.status, 413);

      // consume the response body
      await dataResponse.body?.cancel();

      partialDone();
    });
  });

  it("should trigger when the client sends a payload bigger than maxHttpBufferSize (ws)", () => {
    const engine = new Server({
      maxHttpBufferSize: 100
    });

    return setup(engine, 1, (port, done) => {
      engine.on("connection", (socket) => {
        socket.on("close", (reason) => {
          assertEquals(reason, "transport error");
          done();
        });
      });

      const socket = new WebSocket(
        `ws://localhost:${port}/engine.io/?EIO=4&transport=websocket`
      );

      socket.onmessage = () => {
        socket.send("b".repeat(101));
      };
    });
  });
});
