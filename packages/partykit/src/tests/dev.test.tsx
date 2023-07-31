import { describe, it, expect, afterEach } from "vitest";
import { render } from "ink-testing-library";
import type { DevProps } from "../dev";
import { Dev } from "../dev";
import { fetch } from "undici";
import { WebSocket } from "ws";
import { ErrorBoundary } from "react-error-boundary";
import React from "react";
import { Text } from "ink";

const onConnectFixture = `${__dirname}/fixture.js`;
const onRequestFixture = `${__dirname}/on-request-fixture.js`;
const publicFixture = `${__dirname}/public-fixture`;

let devProc: ReturnType<typeof render>;

async function runDev(props: DevProps) {
  if (devProc) {
    throw new Error("dev is already running");
  }
  return new Promise<void>((resolve, reject) => {
    devProc = render(
      <ErrorBoundary
        fallbackRender={() => <Text>Ooops</Text>}
        onError={(e) => {
          reject(e);
        }}
      >
        <Dev
          enableInspector={false}
          {...props}
          onReady={() => {
            resolve();
          }}
        />
      </ErrorBoundary>
    );
  });
}

afterEach(async () => {
  devProc.unmount();
  await new Promise((resolve) => {
    setTimeout(resolve, 100);
  });
  // @ts-expect-error asdasd
  devProc = null;
});

describe("dev", () => {
  it("should error if no script path is provided", async () => {
    await expect(runDev({})).rejects.toThrowErrorMatchingInlineSnapshot(
      '"Missing entry point, please specify \\"main\\" in your config"'
    );
  });

  it("should error if trying to make a request without an onRequest handler", async () => {
    await runDev({ main: onConnectFixture });

    await expect(() =>
      fetch("http://localhost:1999/party/theroom")
    ).rejects.toThrowErrorMatchingInlineSnapshot('"fetch failed"'); // TODO: we should catch the 500?
  });

  it("should start a server for a given input script path", async () => {
    await runDev({ main: onRequestFixture });

    const res = await fetch("http://127.0.0.1:1999/party/theroom");
    expect(await res.text()).toMatchInlineSnapshot(
      '"pong: http://127.0.0.1:1999/party/theroom"'
    );
  });

  it("should start a server on a given port", async () => {
    await runDev({ main: onRequestFixture, port: 9999 });
    const res = await fetch("http://127.0.0.1:9999/party/theroom");
    expect(await res.text()).toMatchInlineSnapshot(
      '"pong: http://127.0.0.1:9999/party/theroom"'
    );
  });

  it("should let you connect to a room with a websocket", async () => {
    await runDev({ main: onConnectFixture });
    const ws = new WebSocket("ws://127.0.0.1:1999/party/theroom?_pk=123");
    try {
      await new Promise((resolve) => ws.on("open", resolve));
      expect(ws.readyState).toBe(WebSocket.OPEN);
    } finally {
      ws.close();
    }
  });

  it("cannot connect to non-room path", async () => {
    await runDev({ main: onConnectFixture });
    const ws = new WebSocket("ws://localhost:1999/notaroom?_pk=123");
    try {
      await new Promise((resolve) => ws.on("error", resolve));
      expect(ws.readyState).toBe(WebSocket.CLOSED);
    } finally {
      ws.close();
    }
  });

  it.skip("should serve static assets in dev", async () => {
    await runDev({ main: onConnectFixture, assets: publicFixture });
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
