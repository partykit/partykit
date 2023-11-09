import { createServer, type Socket } from "party.io";
import type * as Party from "partykit/server";

const Server = createServer((io, req, lobby, _ctx) => {
  // Chatroom

  io.on("connection", (socket: Socket) => {
    // @ts-expect-error TODO
    const partyName = io._nsps.get("/")!.adapter.partyName;

    let username: string;

    let addedUser = false;

    // when the client emits 'new message', this listens and executes
    socket.on("new message", (data) => {
      // we tell the client to execute 'new message'
      socket.broadcast.emit("new message", {
        username,
        message: data,
      });
    });

    // when the client emits 'add user', this listens and executes
    socket.on("add user", async (newUsername) => {
      if (addedUser) return;
      const numUsers = parseInt(
        await lobby.parties.main
          .get(partyName)
          .fetch("/user-count")
          .then((res) => res.text()),
        10
      );

      // we store the username in the socket session for this client
      username = newUsername;

      // ++numUsers;
      addedUser = true;
      socket.emit("login", {
        numUsers: numUsers + 1,
      });
      // echo globally (all clients) that a person has connected
      socket.broadcast.emit("user joined", {
        username,
        numUsers: numUsers + 1,
      });
    });

    // when the client emits 'typing', we broadcast it to others
    socket.on("typing", () => {
      socket.broadcast.emit("typing", {
        username,
      });
    });

    // when the client emits 'stop typing', we broadcast it to others
    socket.on("stop typing", () => {
      socket.broadcast.emit("stop typing", {
        username,
      });
    });

    // when the user disconnects.. perform this
    socket.on("disconnect", async () => {
      const numUsers = parseInt(
        await lobby.parties.main
          .get(partyName)
          .fetch("/user-count")
          .then((res) => res.text()),
        10
      );
      if (addedUser) {
        // echo globally that this client has left
        socket.broadcast.emit("user left", {
          username,
          numUsers: numUsers - 1,
        });
      }
    });
  });
});

export default class extends Server {
  // eslint-disable-next-line @typescript-eslint/unbound-method
  onFetch = Server.onFetch;

  async onRequest(req: Party.Request): Promise<Response> {
    const url = new URL(req.url);
    if (url.pathname.endsWith(`/user-count`) && req.method === "GET") {
      console.log("user-count", [...this.party.getConnections()].length);
      return new Response([...this.party.getConnections()].length.toString());
    }
    return super.onRequest(req);
  }
}
