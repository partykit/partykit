import { enableLogs, parseSessionID } from "misc/util.test";
import { assertEquals, describe, it } from "vitest";

import { Server } from "../lib/server";
import { setup } from "./setup.test";

await enableLogs();

describe("heartbeat", () => {
  it("should keep the connection alive (polling)", () => {
    const engine = new Server({
      pingInterval: 10,
      pingTimeout: 25
    });

    return setup(engine, 1, async (port, done) => {
      const handshake = await fetch(
        `http://localhost:${port}/engine.io/?EIO=4&transport=polling`,
        {
          method: "get"
        }
      );

      const sid = await parseSessionID(handshake);
      const HEARTBEAT_COUNT = 10;

      for (let i = 0; i < HEARTBEAT_COUNT; i++) {
        const pollResponse = await fetch(
          `http://localhost:${port}/engine.io/?EIO=4&transport=polling&sid=${sid}`,
          {
            method: "get"
          }
        );

        assertEquals(pollResponse.status, 200);
        assertEquals(await pollResponse.text(), "2");

        const dataResponse = await fetch(
          `http://localhost:${port}/engine.io/?EIO=4&transport=polling&sid=${sid}`,
          {
            method: "post",
            body: "3"
          }
        );

        assertEquals(dataResponse.status, 200);
        // consume the response body
        await dataResponse.body?.cancel();
      }

      done();
    });
  });

  it("should keep the connection alive (ws)", () => {
    const engine = new Server({
      pingInterval: 10,
      pingTimeout: 25
    });

    return setup(engine, 1, (port, done) => {
      const socket = new WebSocket(
        `ws://localhost:${port}/engine.io/?EIO=4&transport=websocket`
      );

      let i = 0;
      const HEARTBEAT_COUNT = 10;

      socket.onmessage = ({ data }) => {
        switch (i++) {
          case 0:
            // ignore handshake
            break;
          case HEARTBEAT_COUNT:
            socket.close();
            done();
            break;
          default:
            assertEquals(data, "2");
            socket.send("3");
        }
      };
    });
  });
});
