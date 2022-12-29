export function onConnect(ws) {
  ws.onmessage = function incoming(evt) {
    if (evt.data === "ping") {
      ws.send("pong");
    } else {
      ws.send("unknown");
    }
  };
}
