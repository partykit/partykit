import { useEffect, useRef } from "react";
import type { PartySocketOptions } from ".";
import PartySocket from ".";
import useWebSocketImpl from "./use-ws";

type UsePartySocketOptions = PartySocketOptions & {
  onOpen?: (event: WebSocketEventMap["open"]) => void;
  onMessage?: (event: WebSocketEventMap["message"]) => void;
  onClose?: (event: WebSocketEventMap["close"]) => void;
  onError?: (event: WebSocketEventMap["error"]) => void;
};

// A React hook that wraps PartySocket
export default function usePartySocket(options: UsePartySocketOptions) {
  const { onOpen, onMessage, onClose, onError, ...partySocketOptions } =
    options;

  const socketRef = useRef<PartySocket>(
    new PartySocket({
      ...partySocketOptions,
      startClosed: true, // only connect on mount
    })
  );

  // note: this effect must be defined before the auto-connect effect below
  useEffect(() => {
    const socket = socketRef.current;
    if (onOpen) socket.addEventListener("open", onOpen);
    if (onClose) socket.addEventListener("close", onClose);
    if (onError) socket.addEventListener("error", onError);
    if (onMessage) socket.addEventListener("message", onMessage);

    return () => {
      if (onOpen) socket.removeEventListener("open", onOpen);
      if (onClose) socket.removeEventListener("close", onClose);
      if (onError) socket.removeEventListener("error", onError);
      if (onMessage) socket.removeEventListener("message", onMessage);
    };
  }, [onOpen, onMessage, onClose, onError]);

  // note: this effect must be defined after the event listener registration above
  useEffect(
    () => {
      const socket = socketRef.current;
      if (options.startClosed !== true) {
        socket.reconnect();
      }

      return () => {
        socket.close();
      };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );
  return socketRef.current;
}

export { useWebSocketImpl as useWebSocket };
