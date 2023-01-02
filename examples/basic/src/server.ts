export default {
  onConnect(ws: WebSocket) {
    // your business logic here
    ws.onmessage = function incoming(evt) {
      if (evt.data === "ping") {
        ws.send("pong");
      }
    };
  },
  async unstable_onValidate(_req: Request): Promise<boolean> {
    return true;
  },
};
