// @ts-expect-error we should type these modules properly

import fibonacci from "./fib.wasm?module";
import type { PartyKitServer } from "partykit/server";

const fib = new WebAssembly.Instance(fibonacci).exports.fib as (
  n: number
) => number;

export default {
  async onConnect(ws) {
    ws.send("fibonacci:" + fib(20));
  },
} satisfies PartyKitServer;
