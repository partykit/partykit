import React from "react";
import { ErrorBoundary } from "react-error-boundary";
import { Text } from "ink";
import { fetch } from "undici";
import { afterEach, describe, expect, it } from "vitest";
import { WebSocket } from "ws";

import { Dev } from "../dev";
import { render } from "./ink-testing-library";

import type { DevProps } from "../dev";

const onConnectFixture = `${__dirname}/fixture.js`;
const onRequestFixture = `${__dirname}/on-request-fixture.js`;
const publicFixture = `${__dirname}/public-fixture`;

let devProc: ReturnType<typeof render>;

async function runDev(props: DevProps) {
  if (devProc) {
    throw new Error("dev is already running");
  }
  return new Promise<{ host: string; port: number }>((resolve, reject) => {
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
          onReady={(host, port) => {
            resolve({ host, port });
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
      `[Error: Missing entry point, please specify "main" in your config]`
    );
  });

  it("should error if trying to make a request without an onRequest handler", async () => {
    const { host, port } = await runDev({ main: onConnectFixture });

    const res = await fetch(`http://${host}:${port}/party/theroom`);

    expect(res.status).toBe(500);
    expect(await res.text()).toMatchInlineSnapshot('"No onRequest handler"');
  });

  it("should start a server for a given input script path", async () => {
    const { host, port } = await runDev({ main: onRequestFixture });

    const res = await fetch(`http://${host}:${port}/party/theroom`);
    expect(await res.text()).toMatchInlineSnapshot(
      `"pong: http://${host}:${port}/party/theroom"`
    );
  });

  it("should start a server on a given port", async () => {
    const { host, port } = await runDev({ main: onRequestFixture, port: 9999 });
    const res = await fetch(`http://${host}:${port}/party/theroom`);
    expect(await res.text()).toMatchInlineSnapshot(
      `"pong: http://${host}:9999/party/theroom"`
    );
  });

  it("should let you connect to a room with a websocket", async () => {
    const { host, port } = await runDev({ main: onConnectFixture });
    const ws = new WebSocket(`ws://${host}:${port}/party/theroom?_pk=123`);
    try {
      await new Promise((resolve) => ws.on("open", resolve));
      expect(ws.readyState).toBe(WebSocket.OPEN);
    } finally {
      ws.close();
    }
  });

  it("cannot connect to non-room path", async () => {
    const { host, port } = await runDev({ main: onConnectFixture });
    const ws = new WebSocket(`ws://${host}:${port}/notaroom?_pk=123`);
    try {
      await new Promise((resolve) => ws.on("error", resolve));
      expect(ws.readyState).toBe(WebSocket.CLOSED);
    } finally {
      ws.close();
    }
  });

  it("should serve static assets in dev", async () => {
    const { host, port } = await runDev({
      main: onConnectFixture,
      serve: publicFixture
    });
    const res = await fetch(`http://${host}:${port}`);
    expect(res.status).toBe(200);
    expect(await res.text()).toMatchInlineSnapshot(`
      "<!doctype html>
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
