import type { PartyKitServer } from "partykit/server";

// @ts-expect-error we should fix this but I don't know how
import fibonacci from "./fib.wasm";

// declare module "./fib.wasm" {
//   const fibonacci: WebAssembly.Module;
//   export default fibonacci;
// }

const fib = new WebAssembly.Instance(fibonacci).exports.fib as (
  n: number
) => number;

export default {
  async onConnect(ws) {
    ws.send("fibonacci:" + fib(20));
  },
  async onRequest(_req) {
    return new Response(fib(20) + "");
  }
} satisfies PartyKitServer;
