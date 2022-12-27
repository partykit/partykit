export function connect(ws) {
  ws.onmessage = function incoming(evt) {
    if (evt.data === "ping") {
      ws.send("pong");
    } else {
      ws.send("unknown");
    }
  };
}
