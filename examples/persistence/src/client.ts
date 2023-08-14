import PartySocket from "partysocket";

const partySocket = new PartySocket({
  host: process.env.PARTYKIT_HOST as string,
  room: "some-room",
});

const latencyPingStarts = new Map();

partySocket.onerror = (err) => console.error({ err });
partySocket.onclose = (evt) => console.log("closed", evt);
partySocket.onopen = () => partySocket.send("ping");
partySocket.onmessage = (evt) => {
  const data = evt.data as string;
  if (data.startsWith("latency:")) {
    const id = data.split(":")[1];
    const latency = Date.now() - latencyPingStarts.get(id);
    latencyPingStarts.delete(id);
    latencyMonitor.innerText = `${latency / 2}ms`;
  } else if (data.startsWith("count:")) {
    const count = parseInt(data.split(":")[1]);
    document.getElementById("count")!.innerText = `${count}`;
  }
};

setInterval(() => {
  const id = crypto.randomUUID();
  latencyPingStarts.set(id, Date.now());
  partySocket.send(`latency:${id}`);
}, 1000);

const latencyMonitor = document.createElement("div");
Object.assign(latencyMonitor.style, {
  position: "fixed",
  top: "0",
  right: "0",
  width: "100px",
  height: "100px",
  "text-align": "center",
  background: "white",
  padding: "10px",
  zIndex: "9999",
});

document.body.appendChild(latencyMonitor);

export function increment() {
  partySocket.send("increment");
}

export function decrement() {
  partySocket.send("decrement");
}
