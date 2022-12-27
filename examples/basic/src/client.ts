import { PartySocket } from "partykit/src/client";

const partySocket = new PartySocket({
  host: "localhost:1999",
  room: "some-room",
});

partySocket.onopen = () => partySocket.send("ping");
partySocket.onmessage = (evt) => console.log(evt.data); // "pong"
