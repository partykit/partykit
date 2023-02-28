// import React from "react";
// import PartySocket from ".";
import { useEffect, useRef } from 'react';
import type { PartySocketOptions } from '.';
import PartySocket from '.';

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
  return socketRef.current;
}
