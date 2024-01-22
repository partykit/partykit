import PartySocket from "partysocket";

declare const PARTYKIT_HOST: string;

const log = (text: string) => {
  const message = document.createElement("div");
  message.textContent = text;
  document.body.appendChild(message);
};

const partySocket = new PartySocket({
  host: PARTYKIT_HOST,
  room: "some-room"
});

partySocket.onerror = (err: { message: string }) =>
  log("error: " + err.message);
partySocket.onclose = () => log("closed");
partySocket.onopen = () => {
  log("open");
};

partySocket.onmessage = (evt: { data: string }) => {
  log(evt.data);
};

document.getElementById("ping")?.addEventListener("click", () => {
  partySocket.send("Ping");
});
