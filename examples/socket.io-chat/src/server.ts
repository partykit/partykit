import { createServer, type Socket } from "party.io";
import type * as Party from "partykit/server";

const Server = createServer((io, req, lobby, ctx) => {
  // Chatroom

  io.on("connection", (socket: Socket) => {
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
      await lobby.parties.main.get(partyName).fetch("/user-count", {
        method: "POST",
        body: (numUsers + 1).toString(),
      });
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
      let numUsers = parseInt(
        await lobby.parties.main
          .get(partyName)
          .fetch("/user-count")
          .then((res) => res.text()),
        10
      );
      if (addedUser) {
        await lobby.parties.main.get(partyName).fetch("/user-count", {
          method: "POST",
          body: (numUsers - 1).toString(),
        });

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
  onFetch = Server.onFetch;

  async onRequest(req: Party.Request): Promise<Response> {
    const url = new URL(req.url);
    if (url.pathname.endsWith(`/user-count`)) {
      if (req.method === "GET") {
        return new Response(
          ((await this.party.storage.get<number>("user-count")) || 0).toString()
        );
      } else if (req.method === "POST") {
        const count = parseInt(await req.text(), 10);
        await this.party.storage.put("user-count", count);
        return new Response(count.toString());
      }
    }
    return super.onRequest(req);
  }
}
