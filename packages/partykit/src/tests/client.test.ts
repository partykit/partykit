/**
 * @vitest-environment jsdom
 */
import { describe, it, afterEach } from "vitest";
import { dev } from "../cli";
import { PartySocket } from "../client";

const fixture = `${__dirname}/fixture.js`;

let devProc: Awaited<ReturnType<typeof dev>> | undefined;

const runDev: typeof dev = async (...args) => {
  if (devProc) {
    throw new Error("dev is already running");
  }
  devProc = await dev(...args);
  return devProc;
};

afterEach(async () => {
  await devProc?.close();
  devProc = undefined;
});

describe("socket", () => {
  it("uh, connects?", async () => {
    await runDev(fixture);

    const partySocket = new PartySocket({
      host: "localhost:1999",
      room: "some-room",
    });
    try {
      await new Promise<void>((resolve, reject) => {
        partySocket.onopen = () => partySocket.send("ping");
        partySocket.onmessage = (evt) => {
          if (evt.data === "pong") {
            resolve();
          } else {
            reject(new Error(`Unexpected message: ${evt.data}`));
          }
        };
      });
    } finally {
      partySocket.close();
    }
  });
});
