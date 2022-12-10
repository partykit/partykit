export function connect(ws) {
  // console.log("connection");
  ws.onmessage = function incoming(evt) {
    console.log(evt.data);
    ws.send("pong");
  };
}
