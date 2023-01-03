import PartySocket from "partysocket";

const partySocket = new PartySocket({
  host: "localhost:1999",
  room: "some-room",
});

partySocket.onerror = (err) => console.error({ err });
partySocket.onclose = (evt) => console.log("closed", evt);
partySocket.onopen = () => partySocket.send("ping");
partySocket.onmessage = (evt) => console.log(evt.data); // "pong"
