import type * as Party from "partykit/server";

export default class implements Party.Server {
  constructor(public room: Party.Room) {}
  onMessage(
    message: string | ArrayBuffer | ArrayBufferView,
    sender: Party.Connection<unknown>
  ): void | Promise<void> {
    if (message === "ping") {
      console.log("received", message);
      sender.send("pong");
    }
  }
}
