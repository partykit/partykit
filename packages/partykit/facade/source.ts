// This is the facade for the worker that will be used in partykit.
// It will be compiled and imported by the CLI.

// @ts-expect-error We'll be replacing __WORKER__ with the path to the input worker
import Worker from "__WORKER__";
import type { WebSocketServer } from "ws";

declare const wss: WebSocketServer;

async function handleRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);
  if (url.pathname.startsWith("/party/")) {
    if (
      Worker.unstable_onValidate &&
      typeof Worker.unstable_onValidate === "function"
    ) {
      const isValid = await Worker.unstable_onValidate(request);
      if (typeof isValid !== "boolean") {
        throw new Error(".onValidate() must return a boolean");
      }
      if (!isValid) {
        return new Response("Unauthorized", { status: 401 });
      }
    }
  }
  return new Response("Not found", { status: 404 });
}

addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event.request));
});

if (typeof Worker.onConnect !== "function") {
  throw new Error("onConnect is not a function");
}

wss.on("connection", Worker.onConnect);
