// import React from "react";
// import PartySocket from ".";
import { useEffect, useRef, useState } from "react";

import WebSocket from "./ws";
import type { Options, ProtocolsProvider, UrlProvider } from "./ws";

type UseWebSocketOptions = Options & {
  onOpen?: (event: WebSocketEventMap["open"]) => void;
  onMessage?: (event: WebSocketEventMap["message"]) => void;
  onClose?: (event: WebSocketEventMap["close"]) => void;
  onError?: (event: WebSocketEventMap["error"]) => void;
};

// A React hook that wraps PartySocket
export default function useWebSocket(
  url: UrlProvider,
  protocols?: ProtocolsProvider,
  options?: UseWebSocketOptions
) {
  // we want to use startClosed as an initial state
  // so we hold it in a state hook and never change it
  const [startClosed] = useState<boolean>(options?.startClosed || false);
  const { onOpen, onMessage, onClose, onError, ...webSocketOptions } =
    options || {};

  const socketRef = useRef<WebSocket>(
    new WebSocket(url, protocols, {
      ...webSocketOptions,
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
  useEffect(() => {
    const socket = socketRef.current;
    if (startClosed !== true) {
      socket.reconnect();
    }

    return () => {
      socket.close();
    };
  }, [startClosed]);
  return socketRef.current;
}
