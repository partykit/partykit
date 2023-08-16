import PartySocket, { PartySocketOptions } from ".";
import { WebSocketEventMap } from "./ws";
import React, {
  PropsWithChildren,
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

const PartySocketContext = createContext<PartySocket | null>(null);

export function PartySocketProvider({
  children,
  ...options
}: PropsWithChildren<PartySocketOptions>) {
  const [socket] = useState(
    () => new PartySocket({ startClosed: true, ...options })
  );

  useEffect(() => {
    if (options.startClosed !== true) socket.reconnect();
    return () => {
      socket.close();
    };
  }, []);

  return (
    <PartySocketContext.Provider value={socket}>
      {children}
    </PartySocketContext.Provider>
  );
}

export const usePartySocket = () => {
  const socket = useContext(PartySocketContext);
  if (!socket)
    throw new Error("usePartySocket must be used within a PartySocketProvider");
  return socket;
};

export const usePartySocketEvent = <
  E extends keyof WebSocketEventMap,
  CbArgs extends WebSocketEventMap[E]
>(
  event: E,
  callback: (
    e: CbArgs extends Event ? WebSocketEventMap[E] : never
  ) => CbArgs extends Event ? void : never
) => {
  const socket = usePartySocket();
  const _callback = useRef(callback);
  _callback.current = callback;

  useEffect(() => {
    socket.addEventListener(event, _callback.current);
    return () => {
      socket.removeEventListener(event, _callback.current);
    };
  }, [socket]);

  return socket;
};

export const usePartySocketMessage = (
  callback: (e: WebSocketEventMap["message"]) => void
) => usePartySocketEvent("message", callback);
