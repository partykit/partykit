import PartySocket from "partysocket";
declare const PARTYKIT_HOST: string;

const log = (text: string) => {
  const message = document.createElement("div");
  message.textContent = text;
  document.body.appendChild(message);
};

const partySocket = new PartySocket({
  host: PARTYKIT_HOST,
  room: "some-room",
});

partySocket.onerror = (err) => log("error: " + err.message);
partySocket.onclose = (evt) => log("closed");
partySocket.onopen = () => {
  log("open");
};

partySocket.onmessage = (evt) => {
  const data = evt.data as string;
  log(data);
};

document.getElementById("ping")?.addEventListener("click", () => {
  partySocket.send("Ping");
});
