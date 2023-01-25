import { WebsocketProvider } from "y-websocket";
import type * as Y from "yjs";

export default class YPartyKitProvider extends WebsocketProvider {
  constructor(
    host: string,
    room: string,
    doc: Y.Doc,
    options: ConstructorParameters<typeof WebsocketProvider>[3] = {}
  ) {
    const serverUrl = `${
      host.startsWith("localhost:") || host.startsWith("127.0.0.1:")
        ? "ws"
        : "wss"
    }://${host}/party`;
    if (options.params === undefined) {
      options.params = {
        _pk: crypto.randomUUID(),
      };
    } else {
      options.params._pk = crypto.randomUUID();
    }
    super(serverUrl, room, doc, options);
  }
}
