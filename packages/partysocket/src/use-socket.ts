import { useEffect, useMemo, useRef, useState } from "react";

import type WebSocket from "./ws";
import type { Options } from "./ws";

/** When any of the option values are changed, we should reinitialize the socket */
export const getOptionsThatShouldCauseRestartWhenChanged = (
  options: Options
) => [
  options.startClosed,
  options.minUptime,
  options.maxRetries,
  options.connectionTimeout,
  options.maxEnqueuedMessages,
  options.maxReconnectionDelay,
  options.minReconnectionDelay,
  options.reconnectionDelayGrowFactor,
  options.debug
];

/**
 * Initializes a PartySocket (or WebSocket) and keeps it stable across renders,
 * but reconnects and updates the reference when any of the connection args change.
 */
export function useStableSocket<T extends WebSocket, TOpts extends Options>({
  options,
  createSocket,
  createSocketMemoKey: createOptionsMemoKey
}: {
  options: TOpts;
  createSocket: (options: TOpts) => T;
  createSocketMemoKey: (options: TOpts) => string;
}) {
  // ensure we only reconnect when necessary
  const shouldReconnect = createOptionsMemoKey(options);
  const socketOptions = useMemo(() => {
    return options;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldReconnect]);

  // this is the socket we return
  const [socket, setSocket] = useState<T>(() =>
    // only connect on first mount
    createSocket({ ...socketOptions, startClosed: true })
  );

  // keep track of the socket we initialized
  const socketInitializedRef = useRef<T | null>(null);

  // allow changing the socket factory without reconnecting
  const createSocketRef = useRef(createSocket);
  createSocketRef.current = createSocket;

  // finally, initialize the socket
  useEffect(() => {
    // we haven't yet restarted the socket
    if (socketInitializedRef.current === socket) {
      // create new socket
      const newSocket = createSocketRef.current({
        ...socketOptions,
        // when reconnecting because of options change, we always reconnect
        // (startClosed only applies to initial mount)
        startClosed: false
      });

      // update socket reference (this will cause the effect to run again)
      setSocket(newSocket);
    } else {
      // if this is the first time we are running the hook, connect...
      if (!socketInitializedRef.current && socketOptions.startClosed !== true) {
        socket.reconnect();
      }
      // track initialized socket so we know not to do it again
      socketInitializedRef.current = socket;
      // close the old socket the next time the socket changes or we unmount
      return () => {
        socket.close();
      };
    }
  }, [socket, socketOptions]);

  return socket;
}
