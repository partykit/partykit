import PartySocket, { WebSocket } from "partysocket";

document.getElementById("app")!.innerText = location.href;

const partySocket = new PartySocket({
  host: window.location.host,
  room: "some-room"
});

function generateUUID() {
  let d = new Date().getTime();
  if (window.performance && typeof window.performance.now === "function") {
    d += performance.now(); //use high-precision timer if available
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (d + Math.random() * 16) % 16 | 0;
    d = Math.floor(d / 16);
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

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
  }
};

setInterval(() => {
  const id = generateUUID();
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
  zIndex: "9999"
});

document.body.appendChild(latencyMonitor);

const fetchSocket = new WebSocket(
  `ws://${window.location.host}/test-on-socket`,
  [],
  {
    maxRetries: 0
  }
);
fetchSocket.send("hello");
fetchSocket.addEventListener("message", (evt) => {
  console.log("got a message from server", evt.data);
});
