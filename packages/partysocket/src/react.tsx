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

const globalPartySockets: {
  [host: string]: {
    [room: string]: PartySocket;
  };
} = {};

const getGlobalPartySocket = (options: PartySocketOptions) => {
  const { host, room } = options;
  globalPartySockets[host] ??= {};
  globalPartySockets[host][room] ??= new PartySocket({
    ...options,
    startClosed: true,
  });

  return globalPartySockets[host][room];
};

export function PartySocketProvider({
  children,
  ...options
}: PropsWithChildren<PartySocketOptions>) {
  const [socket] = useState(() => getGlobalPartySocket(options)!);

  return (
    <PartySocketContext.Provider value={socket}>
      {children}
    </PartySocketContext.Provider>
  );
}

type UsePartySocketListeners = {
  onOpen?: (event: WebSocketEventMap["open"]) => void;
  onMessage?: (event: WebSocketEventMap["message"]) => void;
  onClose?: (event: WebSocketEventMap["close"]) => void;
  onError?: (event: WebSocketEventMap["error"]) => void;
};
type UsePartySocketOptions =
  | (PartySocketOptions & UsePartySocketListeners)
  | (UsePartySocketListeners & { room?: never; host?: never });

const usePartySocketEvent = <
  E extends keyof WebSocketEventMap,
  CbArgs extends WebSocketEventMap[E]
>(
  socket: PartySocket | undefined,
  event: E,
  callback:
    | ((
        e: CbArgs extends Event ? WebSocketEventMap[E] : never
      ) => CbArgs extends Event ? void : never)
    | undefined
) => {
  const _callback = useRef(callback);
  _callback.current = callback;

  useEffect(() => {
    if (!socket || !_callback.current) return;
    const stableListener = (e: any) => _callback.current?.(e);
    socket.addEventListener(event, stableListener);
    return () => {
      socket.removeEventListener(event, stableListener);
    };
  }, [socket]);
};

const listenersCounter: { [host: string]: { [room: string]: number } } = {};

/**
 *
 * @param options when provided the hook will ignore it's context and use a global socket with the provided options
 * @returns
 */
export const usePartySocket = ({
  onOpen,
  onClose,
  onError,
  onMessage,
  ...options
}: UsePartySocketOptions) => {
  const socket =
    useContext(PartySocketContext) ||
    (!!options?.host ? getGlobalPartySocket(options) : undefined);

  usePartySocketEvent(socket, "open", onOpen);
  usePartySocketEvent(socket, "message", onMessage);
  usePartySocketEvent(socket, "close", onClose);
  usePartySocketEvent(socket, "error", onError);

  useEffect(() => {
    if (!socket) return;

    const { host, room } = socket.partySocketOptions;
    listenersCounter[host] ??= {};
    listenersCounter[host][room] ??= 0;
    listenersCounter[host][room] += 1;

    // socket starts closed and reconnects when there are listeners
    if (socket.shouldReconnect) socket.reconnect();
    return () => {
      listenersCounter[host][room] -= 1;
      // only close the socket if there are no more listeners
      if (listenersCounter[host][room] === 0) socket?.close();
    };
  }, [socket]);

  if (!socket)
    throw new Error(
      "usePartySocket must be used within a PartySocketProvider, or with a host provided"
    );

  return socket;
};
