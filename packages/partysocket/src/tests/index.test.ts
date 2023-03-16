/**
 * @vitest-environment jsdom
 */
import { describe, it, afterEach } from "vitest";
import { dev } from "partykit/src/cli";
import PartySocket from "..";

// jsdom doesn't appear to have crypto.randomUUID
import crypto from "crypto";
// @ts-expect-error node's types need to be updated
globalThis.crypto.randomUUID = crypto.randomUUID;

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
    await runDev({
      main: fixture,
    });

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
