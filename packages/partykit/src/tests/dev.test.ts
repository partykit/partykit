import { describe, it, expect, afterEach } from "vitest";
import { dev } from "../cli";
import { fetch } from "undici";
import { WebSocket } from "ws";

const fixture = `${__dirname}/fixture.js`;

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
    // @ts-expect-error we're purposely not passing a script path
    await expect(runDev()).rejects.toThrowError("script path is missing");
  });

  it("should start a server for a given input script path", async () => {
    await runDev(fixture, {});
    const res = await fetch("http://localhost:1999/party/theroom");
    expect(await res.text()).toMatchInlineSnapshot('"Not found"');
  });

  it("should start a server on a given port", async () => {
    await runDev(fixture, { port: 9999 });
    const res = await fetch("http://localhost:9999/party/theroom");
    expect(await res.text()).toMatchInlineSnapshot('"Not found"');
  });

  it("should let you connect to a room with a websocket", async () => {
    await runDev(fixture, {});
    const ws = new WebSocket("ws://localhost:1999/party/theroom?_pk=123");
    try {
      await new Promise((resolve) => ws.on("open", resolve));
      expect(ws.readyState).toBe(WebSocket.OPEN);
    } finally {
      ws.close();
    }
  });

  it("cannot connect to non-room path", async () => {
    await runDev(fixture, {});
    const ws = new WebSocket("ws://localhost:1999/notaroom?_pk=123");
    try {
      await new Promise((resolve) => ws.on("error", resolve));
      expect(ws.readyState).toBe(WebSocket.CLOSED);
    } finally {
      ws.close();
    }
  });
});
