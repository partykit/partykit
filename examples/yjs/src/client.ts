import YProvider from "y-partykit/provider";
import * as Y from "yjs";

declare const PARTYKIT_HOST: string;

const doc = new Y.Doc();

// example for attaching query string parameters to the request
const getToken = (): Promise<Record<string, string>> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ token: Date.now().toString() });
    }, 100);
  });
};

const room =
  new URLSearchParams(window.location.search).get("room") ?? "yjs-demo";

const provider = new YProvider(PARTYKIT_HOST, room, doc, {
  connect: false,
  // disable broadcast channel for this demo, so syncing only happens via the partykit server
  // https://developer.mozilla.org/en-US/docs/Web/API/Broadcast_Channel_API
  disableBc: true,
  params: getToken
});
const yMessage: Y.Text = doc.getText("message");
const awareness = provider.awareness;

const generateRandomId = () =>
  Date.now().toString(36) + Math.random().toString(36).substring(2);

let userId: string | null;
userId = localStorage.getItem("userId");

if (userId === null) {
  const newRandomId = generateRandomId();
  localStorage.setItem("userId", newRandomId);
  userId = newRandomId;
}

window.addEventListener("load", () => {
  const connectBtn = document.getElementById(
    "y-connect-btn"
  ) as HTMLButtonElement;
  const sendBtn = document.getElementById("y-send-btn") as HTMLButtonElement;
  const resetBtn = document.getElementById("y-reset-btn") as HTMLButtonElement;
  const messageInput = document.getElementById(
    "y-input-message"
  ) as HTMLInputElement;
  const messageElement = document.getElementById("y-text") as HTMLSpanElement;
  const awarenessElement = document.getElementById(
    "y-connected"
  ) as HTMLParagraphElement;

  awareness.on("change", () => {
    const connectedPeople = awareness.getStates().size;
    awarenessElement.textContent = `${connectedPeople} ${
      connectedPeople === 1 ? "Person" : "People"
    } here.`;
  });

  connectBtn.addEventListener("click", () => {
    if (provider.shouldConnect) {
      provider.disconnect();
    } else {
      provider.connect();
    }
  });

  const onConnect = () => {
    connectBtn.textContent = "Disconnect";

    sendBtn.disabled = false;
    sendBtn.textContent = "Broadcasting Message";

    resetBtn.disabled = false;
    resetBtn.textContent = "Reset Broadcast";

    messageInput.disabled = false;
    messageElement.textContent = yMessage.toJSON();

    awareness.setLocalState({ id: userId });
  };

  const onDisconnect = () => {
    connectBtn.textContent = "Connect";

    sendBtn.disabled = true;
    sendBtn.textContent = "Please Connect Before Broadcasting Message";

    resetBtn.disabled = true;
    resetBtn.textContent = "Please Connect Before Resetting";

    messageInput.disabled = true;
    messageElement.textContent = "";
    awarenessElement.textContent = "";
  };

  provider.on("sync", (connected: boolean) =>
    connected ? onConnect() : onDisconnect()
  );

  sendBtn.addEventListener("click", () => {
    doc.transact(() => {
      yMessage.delete(0, yMessage.length);
      yMessage.insert(0, messageInput.value);
      messageInput.value = "";
    });
  });

  resetBtn.addEventListener("click", () => {
    yMessage.delete(0, yMessage.length);
  });

  yMessage.observe((event, _) => {
    messageElement.textContent = event.currentTarget.toJSON();
  });
});
