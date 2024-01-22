import PartySocket from "partysocket";

declare const PARTYKIT_HOST: string;

const partySocket = new PartySocket({
  host: PARTYKIT_HOST,
  room: "some-room"
});

partySocket.onerror = (err) => console.error({ err });
partySocket.onclose = (evt) => console.log("closed", evt);
partySocket.onopen = () => partySocket.send("ping");
partySocket.onmessage = (evt) => {
  console.log("received", evt.data);
};
