/// <reference types="@edge-runtime/types" />

type POJO =
  | string
  | number
  | boolean
  | null
  | undefined
  | POJO[]
  | { [key: string]: POJO };

class Server {
  onSend(type: string, handler: (payload?: POJO) => void): void {}
  onGet(type: string, handler: (payload?: POJO) => POJO | Promise<POJO>): void {
    return;
  }
  onSubscribe(
    data: string,
    handler: (payload?: POJO) => AsyncIterable<POJO>
  ): void {}
}

// like socket.io, but good
const server = new Server();

// server.room => "some-room"
// server.url => "ws://localhost:1999"

server.onSend("ping", (data) => {
  console.log(data);
});

server.onGet("ping", (data) => {
  console.log(data);
  return "pong";
});

server.onSubscribe("ping", (data) => {
  return (async function* () {
    yield "pong 1";
    yield "pong 2";
    yield "pong 3";
  })();
});

export default server;

// export default {
//   connect(ws: WebSocket) {
//     ws.onmessage = function incoming(evt) {
//       ws.send("pong");
//     };
//   }
// }
