/// <reference no-default-lib="true"/>
/// <reference lib="dom"/>

import PartySocket from "partysocket";

const partySocket = new PartySocket({
  host: "localhost:1999",
  // host: "testy.threepointone.partykit.dev",
  room: "some-room",
});

partySocket.onerror = (err) => console.error({ err });
partySocket.onclose = (evt) => console.log("closed", evt);
partySocket.onopen = () => partySocket.send("ping");
partySocket.onmessage = (evt) => {
  console.log("received", evt.data);
};
