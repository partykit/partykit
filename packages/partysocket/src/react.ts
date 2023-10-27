import { useEffect, useRef, useMemo, useState } from "react";
import type { PartySocketOptions } from ".";
import PartySocket from ".";
import useWebSocketImpl from "./use-ws";

type EventHandlerOptions = {
  onOpen?: (event: WebSocketEventMap["open"]) => void;
  onMessage?: (event: WebSocketEventMap["message"]) => void;
  onClose?: (event: WebSocketEventMap["close"]) => void;
  onError?: (event: WebSocketEventMap["error"]) => void;
};

type UsePartySocketOptions = PartySocketOptions & EventHandlerOptions;

/** Updates options when any option changes that requires the socket to reconnect */
const useStableOptions = (options: PartySocketOptions): PartySocketOptions => {
  const identity = JSON.stringify([
    options.id,
    options.host,
    options.party,
    options.path,
    options.protocol,
    options.protocols,
    // NOTE: if query is defined as a function, the code
    // won't reconnect when you change the function identity
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

  const socketOptions = useStableOptions(partySocketOptions);
  const socketRef = useRef<PartySocket | null>(null);
  const [socket, setSocket] = useState<PartySocket>(
    () =>
      new PartySocket({
        ...socketOptions,
        // only connect on first mount
        startClosed: true,
      })
  );

  const handlersRef = useRef<EventHandlerOptions>({});
  handlersRef.current.onOpen = onOpen;
  handlersRef.current.onMessage = onMessage;
  handlersRef.current.onClose = onClose;
  handlersRef.current.onError = onError;

  // note: this effect must be defined before the auto-connect effect below
  useEffect(() => {
    const _onOpen: typeof onOpen = (event) =>
      handlersRef.current?.onOpen?.(event);
    const _onMessage: typeof onMessage = (event) =>
      handlersRef.current?.onMessage?.(event);
    const _onClose: typeof onClose = (event) =>
      handlersRef.current?.onClose?.(event);
    const _onError: typeof onError = (event) =>
      handlersRef.current?.onError?.(event);

    socket.addEventListener("open", _onOpen);
    socket.addEventListener("close", _onClose);
    socket.addEventListener("error", _onError);
    socket.addEventListener("message", _onMessage);

    return () => {
      socket.removeEventListener("open", _onOpen);
      socket.removeEventListener("close", _onClose);
      socket.removeEventListener("error", _onError);
      socket.removeEventListener("message", _onMessage);
    };
  }, [socket]);

  useEffect(() => {
    console.log(
      "Running hook",
      socketRef.current === socket,
      socketRef.current
    );
    // if new options have come in but we haven't yet reinitialized the socket
    if (socketRef.current === socket) {
      console.log("Creating new socket...", socketOptions);

      // create new socket
      const newSocket = new PartySocket({
        ...socketOptions,
        // when reconnecting because of options change, we always reconnect
        // (startClosed only applies to initial mount)
        startClosed: false,
      });

      // update socket reference (this will cause the effect to run again)
      setSocket(newSocket);
    } else {
      console.log("Configuring existing socket...", socketOptions);

      // if this is the first time we are running the hook, connect...
      if (!socketRef.current && socketOptions.startClosed !== true) {
        console.log("Initial connection...");
        socket.reconnect();
      }

      // track initialized socket so we know not to do it again
      // when options next change
      socketRef.current = socket;

      // close the old socket the next time the socket changes or we unmount
      return () => {
        console.log("Closing socket");
        socket.close();
      };
    }
  }, [socket, socketOptions]);

  return socket;
}

export { useWebSocketImpl as useWebSocket };
// TODO: remove the default export in a future breaking change
export { usePartySocket };
