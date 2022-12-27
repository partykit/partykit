export function connect(ws: WebSocket) {
  ws.onmessage = function incoming(evt) {
    console.log("evt!", evt.data);
    ws.send("pong");
  };
}
