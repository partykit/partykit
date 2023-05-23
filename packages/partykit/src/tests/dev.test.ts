import { describe, it, expect, afterEach } from "vitest";
import { dev } from "../cli";
import { fetch } from "undici";
import { WebSocket } from "ws";

const fixture = `${__dirname}/fixture.js`;
const publicFixture = `${__dirname}/public-fixture`;

let devProc: Awaited<ReturnType<typeof dev>> | undefined = undefined;

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

describe("dev", () => {
  it("should error if no script path is provided", async () => {
    await expect(runDev({})).rejects.toThrowErrorMatchingInlineSnapshot(
      '"Missing entry point, please specify \\"main\\" in your config"'
    );
  });

  it("should start a server for a given input script path", async () => {
    await runDev({ main: fixture });
    const res = await fetch("http://localhost:1999/party/theroom");
    expect(await res.text()).toMatchInlineSnapshot('"Not found"');
  });

  it("should start a server on a given port", async () => {
    await runDev({ main: fixture, port: 9999 });
    const res = await fetch("http://localhost:9999/party/theroom");
    expect(await res.text()).toMatchInlineSnapshot('"Not found"');
  });

  it("should let you connect to a room with a websocket", async () => {
    await runDev({ main: fixture });
    const ws = new WebSocket("ws://localhost:1999/party/theroom?_pk=123");
    try {
      await new Promise((resolve) => ws.on("open", resolve));
      expect(ws.readyState).toBe(WebSocket.OPEN);
    } finally {
      ws.close();
    }
  });

  it("cannot connect to non-room path", async () => {
    await runDev({ main: fixture });
    const ws = new WebSocket("ws://localhost:1999/notaroom?_pk=123");
    try {
      await new Promise((resolve) => ws.on("error", resolve));
      expect(ws.readyState).toBe(WebSocket.CLOSED);
    } finally {
      ws.close();
    }
  });

  it("should serve static assets in dev", async () => {
    await runDev({ main: fixture, assets: publicFixture });
    const res = await fetch("http://localhost:1999");
    expect(res.status).toBe(200);
    expect(await res.text()).toMatchInlineSnapshot(`
      "<!DOCTYPE html>
      <html>
        <head>
          <title>Partykit Public Fixture</title>
        </head>
        <body>
          <h1>Partykit Public Fixture</h1>
          <p>Path: packages/partykit/src/tests/public-fixture/index.html</p>
        </body>
      </html>
      "
    `);
  });
});
