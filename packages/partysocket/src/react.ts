import PartySocket from ".";
import { useAttachWebSocketEventHandlers } from "./use-handlers";
import {
  getOptionsThatShouldCauseRestartWhenChanged,
  useStableSocket
} from "./use-socket";

import type { PartySocketOptions } from ".";
import type { EventHandlerOptions } from "./use-handlers";

type UsePartySocketOptions = Omit<PartySocketOptions, "host"> &
  EventHandlerOptions & {
    host?: string | undefined;
  };

// A React hook that wraps PartySocket
export default function usePartySocket(options: UsePartySocketOptions) {
  const { host, ...otherOptions } = options;

  const socket = useStableSocket({
    options: {
      host:
        host ||
        (typeof window !== "undefined"
          ? window.location.host
          : "dummy-domain.com"),
      ...otherOptions
    },
    createSocket: (options) => new PartySocket(options),
    createSocketMemoKey: (options) =>
      JSON.stringify([
        // NOTE: if query is defined as a function, the socket
        // won't reconnect when you change the function identity
        options.query,
        options.id,
        options.host,
        options.room,
        options.party,
        options.path,
        options.protocol,
        options.protocols,
        ...getOptionsThatShouldCauseRestartWhenChanged(options)
      ])
  });

  useAttachWebSocketEventHandlers(socket, options);

  return socket;
}

export { default as useWebSocket } from "./use-ws";

// TODO: remove the default export in a future breaking change
export { usePartySocket };
