import { useEffect, useRef } from "react";

import type WebSocket from "./ws";

export type EventHandlerOptions = {
  onOpen?: (event: WebSocketEventMap["open"]) => void;
  onMessage?: (event: WebSocketEventMap["message"]) => void;
  onClose?: (event: WebSocketEventMap["close"]) => void;
  onError?: (event: WebSocketEventMap["error"]) => void;
};

/** Attaches event handlers to a WebSocket in a React Lifecycle-friendly way */
export const useAttachWebSocketEventHandlers = (
  socket: WebSocket,
  options: EventHandlerOptions
) => {
  const handlersRef = useRef(options);
  handlersRef.current = options;

  useEffect(() => {
    const onOpen: EventHandlerOptions["onOpen"] = (event) =>
      handlersRef.current?.onOpen?.(event);
    const onMessage: EventHandlerOptions["onMessage"] = (event) =>
      handlersRef.current?.onMessage?.(event);
    const onClose: EventHandlerOptions["onClose"] = (event) =>
      handlersRef.current?.onClose?.(event);
    const onError: EventHandlerOptions["onError"] = (event) =>
      handlersRef.current?.onError?.(event);

    socket.addEventListener("open", onOpen);
    socket.addEventListener("close", onClose);
    socket.addEventListener("error", onError);
    socket.addEventListener("message", onMessage);

    return () => {
      socket.removeEventListener("open", onOpen);
      socket.removeEventListener("close", onClose);
      socket.removeEventListener("error", onError);
      socket.removeEventListener("message", onMessage);
    };
  }, [socket]);
};
