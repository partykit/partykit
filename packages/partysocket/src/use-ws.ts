import WebSocket from "./ws";
import type { Options, ProtocolsProvider, UrlProvider } from "./ws";
import {
  useAttachWebSocketEventHandlers,
  type EventHandlerOptions,
} from "./use-handlers";
import {
  useStableSocket,
  getOptionsThatShouldCauseRestartWhenChanged,
} from "./use-socket";

type UseWebSocketOptions = Options & EventHandlerOptions;

// A React hook that wraps PartySocket
export default function useWebSocket(
  url: UrlProvider,
  protocols?: ProtocolsProvider,
  options: UseWebSocketOptions = {}
) {
  const socket = useStableSocket({
    options,
    createSocket: (options) => new WebSocket(url, protocols, options),
    createSocketMemoKey: (options) =>
      JSON.stringify([
        // will reconnect if url or protocols are specified as a string.
        // if they are functions, the WebSocket will handle reconnection
        url,
        protocols,
        ...getOptionsThatShouldCauseRestartWhenChanged(options),
      ]),
  });

  useAttachWebSocketEventHandlers(socket, options);

  return socket;
}
