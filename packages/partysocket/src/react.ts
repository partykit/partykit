import { useEffect, useMemo, useState, useRef } from "react";
import type { PartySocketOptions } from ".";
import PartySocket from ".";
import useWebSocketImpl from "./use-ws";

type UsePartySocketOptions = PartySocketOptions & {
  onOpen?: (event: WebSocketEventMap["open"]) => void;
  onMessage?: (event: WebSocketEventMap["message"]) => void;
  onClose?: (event: WebSocketEventMap["close"]) => void;
  onError?: (event: WebSocketEventMap["error"]) => void;
};

/** Updates options tha require the socket to reconnect */
const useStableOptions = (options: PartySocketOptions) => {
  const identity = JSON.stringify([
    options.id,
    options.host,
    options.party,
    options.path,
    options.protocol,
    options.protocols,
    // NOTE: if query is defined as a function, the code
    // won't reconnect when you change the function
    options.query,
  ]);

  return useMemo(() => {
    return options;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [identity]);
};

// A React hook that wraps PartySocket
export default function usePartySocket(options: UsePartySocketOptions) {
  const { onOpen, onMessage, onClose, onError, ...partySocketOptions } =
    options;

  const stableOptions = useStableOptions(partySocketOptions);

  const [socket, setSocket] = useState<PartySocket>(
    () => new PartySocket({ ...stableOptions, startClosed: true })
  );

  const activeSocketRef = useRef<PartySocket | null>(null);
  const activeHandlersRef = useRef<Partial<UsePartySocketOptions>>({});

  useEffect(() => {
    if (socket !== activeSocketRef.current) {
      activeSocketRef.current = socket;
      return;
    }

    const activeSocket = activeSocketRef.current;
    const nextSocket = new PartySocket({
      ...stableOptions,
      startClosed: false,
    });

    nextSocket.addEventListener("open", () => {
      activeSocket.close();
    });

    setSocket(nextSocket);

    return () => nextSocket.close();
  }, [socket, stableOptions]);

  // note: this effect must be defined before the auto-connect effect below
  useEffect(() => {
    const prevSocket = activeSocketRef.current;
    const prevHandlers = activeHandlersRef.current;
    const nextHandlers = {
      onOpen,
      onClose,
      onError,
      onMessage,
    };

    if (nextHandlers.onOpen)
      socket.addEventListener("open", nextHandlers.onOpen);
    if (prevHandlers?.onOpen)
      prevSocket?.removeEventListener("open", prevHandlers.onOpen);

    if (nextHandlers.onClose)
      socket.addEventListener("close", nextHandlers.onClose);
    if (prevHandlers?.onClose)
      prevSocket?.removeEventListener("close", prevHandlers.onClose);

    if (nextHandlers.onError)
      socket.addEventListener("error", nextHandlers.onError);
    if (prevHandlers?.onError)
      prevSocket?.removeEventListener("error", prevHandlers.onError);

    if (nextHandlers.onMessage)
      socket.addEventListener("message", nextHandlers.onMessage);
    if (prevHandlers?.onMessage)
      prevSocket?.removeEventListener("message", prevHandlers.onMessage);

    activeSocketRef.current = socket;
    activeHandlersRef.current = nextHandlers;

    // return () => {
    //   console.log("removing socket event listeners", socket.url);
    //   if (onOpen) socket.removeEventListener("open", onOpen);
    //   if (onClose) socket.removeEventListener("close", onClose);
    //   if (onError) socket.removeEventListener("error", onError);
    //   if (onMessage) socket.removeEventListener("message", onMessage);
    // };
  }, [socket, onOpen, onMessage, onClose, onError]);

  // note: this effect must be defined after the event listener registration above
  useEffect(
    () => {
      if (
        options.startClosed !== true &&
        socket.readyState !== socket.OPEN &&
        socket.readyState !== socket.CONNECTING
      ) {
        console.log("opening initial socket", socket.url);
        socket.reconnect();
      }
      //}
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [socket]
  );

  useEffect(() => {
    // when the socket reference changed,
    // or we're unmounting the hook, close
    return () => {
      activeSocketRef.current?.close();
    };
  }, []);

  return socket;
}

export { useWebSocketImpl as useWebSocket };
// TODO: remove the default export in a future breaking change
export { usePartySocket };
