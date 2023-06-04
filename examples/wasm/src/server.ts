/// <reference no-default-lib="true"/>
/// <reference types="@cloudflare/workers-types" />

import fibonacci from "./fib.wasm";
import type { PartyKitServer } from "partykit/server";

const fib = new WebAssembly.Instance(fibonacci).exports.fib as (
  n: number
) => number;

export default {
  async onConnect(ws) {
    ws.send("fibonacci:" + fib(20));
  },
  async onRequest(_req) {
    return new Response(fib(20) + "");
  },
} satisfies PartyKitServer;
