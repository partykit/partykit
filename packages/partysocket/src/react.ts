import type { PartySocketOptions } from ".";
import PartySocket from ".";

import {
  getOptionsThatShouldCauseRestartWhenChanged,
  useStableSocket,
} from "./use-socket";
import {
  useAttachWebSocketEventHandlers,
  type EventHandlerOptions,
} from "./use-handlers";

type UsePartySocketOptions = PartySocketOptions & EventHandlerOptions;

// A React hook that wraps PartySocket
export default function usePartySocket(options: UsePartySocketOptions) {
  const socket = useStableSocket({
    options,
    createSocket: (options) => new PartySocket(options),
    createSocketMemoKey: (options) =>
      JSON.stringify([
        // NOTE: if query is defined as a function, the code
        // won't reconnect when you change the function identity
        options.query,
        options.id,
        options.host,
        options.party,
        options.path,
        options.protocol,
        options.protocols,
        ...getOptionsThatShouldCauseRestartWhenChanged(options),
      ]),
  });

  useAttachWebSocketEventHandlers(socket, options);

  return socket;
}

export { default as useWebSocket } from "./use-ws";

// TODO: remove the default export in a future breaking change
export { usePartySocket };
