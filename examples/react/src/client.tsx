import { createRoot } from "react-dom/client";
import usePartySocket from "partysocket/react";

function App() {
  const socket = usePartySocket({
    room: "test",
    onOpen() {
      socket.send("ping");
    },
    onMessage(message) {
      console.log("received", message.data);
    }
  });
  return <div>hello world</div>;
}

createRoot(document.getElementById("root")!).render(<App />);
