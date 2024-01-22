import { Server } from "../..";
import { serve } from "../../../../test_deps";

const engine = new Server({
  pingInterval: 300,
  pingTimeout: 200,
  maxHttpBufferSize: 1e6,
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT"]
  }
});

engine.on("connection", (socket) => {
  socket.on("message", (arg) => {
    socket.send(arg);
  });
});

await serve(engine.handler(), {
  port: 3000
});
