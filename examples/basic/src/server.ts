export function onConnect(ws: WebSocket) {
  ws.onmessage = function incoming(evt) {
    console.log("evt!", evt.data);
    ws.send("pong");
  };
}

// this doesn't work just yet...
// export function onRequest(_req: Request) {
//   return new Response("Yoohoo from the room");
// }
