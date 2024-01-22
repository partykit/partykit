import { Server } from "../..";
import { serve } from "../../../../test_deps";

const io = new Server({
  pingInterval: 300,
  pingTimeout: 200,
  maxHttpBufferSize: 1e6,
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT"]
  }
});

io.on("connection", (socket) => {
  socket.emit("auth", socket.handshake.auth);

  socket.on("message", (...args) => {
    socket.emit.apply(socket, ["message-back", ...args]);
  });

  socket.on("message-with-ack", (...args) => {
    const ack = args.pop();
    ack(...args);
  });
});

io.of("/custom").on("connection", (socket) => {
  socket.emit("auth", socket.handshake.auth);
});

await serve(io.handler(), {
  port: 3000
});
