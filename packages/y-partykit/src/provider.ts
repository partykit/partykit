import { WebsocketProvider } from "y-websocket";
import type * as Y from "yjs";

function generateUUID(): string {
  // Public Domain/MIT
  if (crypto.randomUUID) {
    return crypto.randomUUID();
  }
  let d = new Date().getTime(); //Timestamp
  let d2 =
    (typeof performance !== "undefined" &&
      performance.now &&
      performance.now() * 1000) ||
    0; //Time in microseconds since page-load or 0 if unsupported
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    let r = Math.random() * 16; //random number between 0 and 16
    if (d > 0) {
      //Use timestamp until depleted
      r = (d + r) % 16 | 0;
      d = Math.floor(d / 16);
    } else {
      //Use microseconds since page-load if supported
      r = (d2 + r) % 16 | 0;
      d2 = Math.floor(d2 / 16);
    }
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

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
        _pk: generateUUID(),
      };
    } else {
      options.params._pk = generateUUID();
    }
    super(serverUrl, room, doc, options);
  }
}
