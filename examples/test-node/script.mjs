/* eslint-disable no-undef */
import PartySocket from "partysocket";
import WS from "ws";

const ps = new PartySocket({
  host: "127.0.0.1:1999",
  room: "test",
  WebSocket: WS
  // debug: true,
  // debugLogger: (_arg, ...args) => {
  //   console.log(...args);
  // }
});

ps.addEventListener("open", () => {
  console.log("connected");
  ps.send("hello");
});

ps.addEventListener("message", (e) => {
  console.log("message (aEL):", e.data);
});

ps.onmessage = (e) => {
  console.log("message (om):", e.data);
};

ps.addEventListener("close", () => {
  console.log("closed");
});

ps.addEventListener("error", (e) => {
  console.log("error:", e.message);
});

console.log("connecting...");
