import { enableLogs, parseSessionID } from "misc/util.test";
import { assertEquals, describe, it } from "vitest";

import { Server } from "../lib/server";
import { setup } from "./setup.test";

await enableLogs();

describe("upgrade", () => {
  it("should upgrade", () => {
    const engine = new Server();

    return setup(engine, 3, async (port, partialDone) => {
      engine.on("connection", (socket) => {
        socket.on("message", (val) => {
          assertEquals(val, "upgraded!");

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

      fetch(
        `http://localhost:${port}/engine.io/?EIO=4&transport=polling&sid=${sid}`,
        {
          method: "get"
        }
      ).then(async (response) => {
        assertEquals(response.status, 200);
        assertEquals(await response.text(), "6"); // "noop" packet

        partialDone();
      });

      const socket = new WebSocket(
        `ws://localhost:${port}/engine.io/?EIO=4&transport=websocket&sid=${sid}`
      );

      socket.onopen = () => {
        socket.send("2probe"); // ping packet
      };

      socket.onmessage = ({ data }) => {
        assertEquals(data, "3probe"); // pong packet
        socket.send("5"); // upgrade packet
        socket.send("4upgraded!");

        partialDone();
      };
    });
  });

  it("should timeout if the upgrade takes too much time", () => {
    const engine = new Server({
      upgradeTimeout: 5
    });

    return setup(engine, 2, async (port, partialDone) => {
      engine.on("connection", (socket) => {
        socket.on("upgrading", (transport) => {
          transport.on("close", partialDone);
        });

        socket.on("upgrade", () => {
          throw "should not happen";
        });
      });

      const response = await fetch(
        `http://localhost:${port}/engine.io/?EIO=4&transport=polling`,
        {
          method: "get"
        }
      );

      const sid = await parseSessionID(response);

      const socket = new WebSocket(
        `ws://localhost:${port}/engine.io/?EIO=4&transport=websocket&sid=${sid}`
      );

      socket.onopen = () => {
        socket.send("2probe"); // ping packet
      };

      socket.onmessage = ({ data }) => {
        assertEquals(data, "3probe"); // pong packet

        partialDone();
      };
    });
  });
});
