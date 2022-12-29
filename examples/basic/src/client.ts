import { PartySocket } from "partykit/client";

const partySocket = new PartySocket({
  // host: "testy.threepointone.partykit.dev",
  host: "localhost:1999",
  room: "some-room",
});

partySocket.onopen = () => partySocket.send("ping");
partySocket.onmessage = (evt) => console.log(evt.data); // "pong"
