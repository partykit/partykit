import "../styles/counter.scss";
import { useState } from "react";
import PartySocket from "partysocket";
import usePartySocket from "partysocket/react";

// the route-level loader in routes/_index.tsx uses this to
// get the initial count from the server
export async function loadInitialCount(host: string) {
  const initialCount = await PartySocket.fetch(
    {
      host,
      party: "counter",
      room: "index",
    },
    {
      method: "GET",
    }
  ).then((res) => res.text());
  return parseInt(initialCount) || 0;
}

export default function Counter({ initialCount }: { initialCount: number }) {
  const [count, setCount] = useState(initialCount);

  const socket = usePartySocket({
    host: "counter-demo.labs.partykit.dev",
    // we could use any room name here
    room: "default-room",
    onMessage(evt) {
      setCount(parseInt(evt.data));
    },
  });

  const increment = () => {
    // optimistic local update
    setCount((prev) => prev + 1);
    // send the update to the server
    socket.send("add");
  };

  return (
    <button className="counter" onClick={increment}>
      Count: {count}
    </button>
  );
}
