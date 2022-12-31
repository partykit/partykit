export default {
  onConnect(ws: WebSocket) {
    ws.onmessage = function incoming(evt) {
      console.log("evt!", evt.data);
      ws.send("pong");
    };
  },
  // this doesn't work just yet...
  // onRequest(_req: Request) {
  //   return new Response("Yoohoo from the room");
  // }
};
