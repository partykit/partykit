// import React from "react";
// import PartySocket from ".";
import type { PartySocketOptions } from ".";
import PartySocket from ".";
import { useRef, useEffect } from "react";

// A React hook that wraps PartySocket
export default function usePartySocket(options: PartySocketOptions) {
  const socketRef = useRef<PartySocket>(
    new PartySocket({
      ...options,
      startClosed: true,
    })
  );
  useEffect(() => {
    socketRef.current.reconnect();
    return () => {
      socketRef.current.close();
    };
  }, []);
}
