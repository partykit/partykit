// This is the facade for the worker that will be used in partykit.
// It will be compiled and imported by the CLI.

// @ts-expect-error We'll be replacing __WORKER__ with the path to the input worker
import * as Worker from "__WORKER__";

declare const wss: import("ws").WebSocketServer;

addEventListener("fetch", (event) => {
  return event.respondWith(new Response("Hello world from the room"));
});

if (typeof Worker.onConnect !== "function") {
  throw new Error("onConnect is not a function");
}

// if (Worker.onRequest && typeof Worker.onRequest !== "function") {
//   throw new Error("onRequest is not a function");
// }

wss.on("connection", Worker.onConnect);
