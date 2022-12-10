import { Party } from "partykit/src/client";

const party = new Party({ host: "localhost:3141" });
const room = party.connect("some-room");

room.onopen = () => room.send("ping");
room.onmessage = (evt) => console.log(evt.data); // "pong"
