import PartySocket from "partysocket";

const partySocket = new PartySocket({
  host: process.env.PARTYKIT_HOST as string,
  room: "some-room",
});

partySocket.onerror = (err) => console.error({ err });
partySocket.onclose = (evt) => console.log("closed", evt);
partySocket.onopen = () => partySocket.send("ping");
partySocket.onmessage = (evt) => {
  console.log("received", evt.data);
};
