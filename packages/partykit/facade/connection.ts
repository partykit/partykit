import type * as Party from "../src/server";

// Polyfill WebSocket status code constants for environments that don't have them
// in order to support libraries that expect standards-compatible WebSocket
// implementations (e.g. PartySocket)
if (!("OPEN" in WebSocket)) {
  const WebSocketStatus = {
    CONNECTING: WebSocket.READY_STATE_CONNECTING,
    OPEN: WebSocket.READY_STATE_OPEN,
    CLOSING: WebSocket.READY_STATE_CLOSING,
    CLOSED: WebSocket.READY_STATE_CLOSED,
  };

  Object.assign(WebSocket, WebSocketStatus);
  Object.assign(WebSocket.prototype, WebSocketStatus);
}

/**
 * Store both platform attachments and user attachments in different namespaces
 */
type ConnectionAttachments = {
  __pk: {
    id: string;
    uri: string;
  };
  __user?: unknown;
};

/**
 * Cache websocket attachments to avoid having to rehydrate them on every property access.
 */
class AttachmentCache {
  _cache = new WeakMap<WebSocket, ConnectionAttachments>();

  get(ws: WebSocket): ConnectionAttachments {
    let attachment = this._cache.get(ws);
    if (!attachment) {
      attachment = WebSocket.prototype.deserializeAttachment.call(ws);
      if (attachment !== undefined) {
        this._cache.set(ws, attachment);
      } else {
        throw new Error(
          "Missing websocket attachment. This is most likely an issue in PartyKit, please open an issue at https://github.com/partykit/partykit/issues"
        );
      }
    }

    return attachment;
  }

  set(ws: WebSocket, attachment: ConnectionAttachments) {
    this._cache.set(ws, attachment);
    WebSocket.prototype.serializeAttachment.call(ws, attachment);
  }
}

const attachments = new AttachmentCache();
const connections = new WeakSet<Party.Connection>();
const isWrapped = (ws: WebSocket): ws is Party.Connection => {
  return connections.has(ws as Party.Connection);
};

/**
 * Wraps a WebSocket with PartyConnection fields that rehydrate the
 * socket attachments lazily only when requested.
 */
export const createLazyConnection = (
  ws: WebSocket | Party.Connection
): Party.Connection => {
  if (isWrapped(ws)) {
    return ws;
  }

  const connection = Object.assign(ws, {
    get id() {
      return attachments.get(ws).__pk.id;
    },
    get uri() {
      return attachments.get(ws).__pk.uri;
    },
    get socket() {
      return ws;
    },
    deserializeAttachment<T = unknown>() {
      const attachment = attachments.get(ws);
      return (attachment.__user ?? null) as T;
    },
    serializeAttachment<T = unknown>(attachment: T) {
      attachments.set(ws, {
        ...attachments.get(ws),
        __user: attachment ?? null,
      });
    },
  });

  connections.add(connection);
  return connection;
};

class HibernatingConnectionIterator
  implements IterableIterator<Party.Connection>
{
  private index: number = 0;
  private sockets: WebSocket[] | undefined;
  constructor(private state: DurableObjectState, private tag?: string) {}

  [Symbol.iterator](): IterableIterator<Party.Connection> {
    return this;
  }

  next(): IteratorResult<Party.Connection, number | undefined> {
    const sockets =
      this.sockets ?? (this.sockets = this.state.getWebSockets(this.tag));

    let socket: WebSocket;
    while ((socket = sockets[this.index++])) {
      // only yield open sockets to match non-hibernating behaviour
      if (socket.readyState === WebSocket.READY_STATE_OPEN) {
        const value = createLazyConnection(socket);
        return { done: false, value };
      }
    }

    // reached the end of the iteratee
    return { done: true, value: undefined };
  }
}

export interface ConnectionManager {
  getCount(): number;
  getConnection(id: string): Party.Connection | undefined;
  getConnections(tag?: string): IterableIterator<Party.Connection>;
  accept(connection: Party.Connection, tags: string[]): void;

  // This can be removed when Party.connections is removed
  legacy_getConnectionMap(): Map<string, Party.Connection>;
}

/**
 * When not using hibernation, we track active connections manually.
 */
export class InMemoryConnectionManager implements ConnectionManager {
  connections: Map<string, Party.Connection> = new Map();
  tags: WeakMap<Party.Connection, string[]> = new WeakMap();

  getCount() {
    return this.connections.size;
  }

  getConnection(id: string) {
    return this.connections.get(id);
  }

  *getConnections(tag?: string): IterableIterator<Party.Connection> {
    if (!tag) {
      yield* this.connections.values();
      return;
    }

    // simulate DurableObjectState.getWebSockets(tag) behaviour
    for (const connection of this.connections.values()) {
      const connectionTags = this.tags.get(connection) ?? [];
      if (connectionTags.includes(tag)) {
        yield connection;
      }
    }
  }

  legacy_getConnectionMap() {
    return this.connections;
  }

  accept(connection: Party.Connection, tags: string[]): void {
    connection.accept();

    this.connections.set(connection.id, connection);
    this.tags.set(connection, [
      // make sure we have id tag
      connection.id,
      ...tags.filter((t) => t !== connection.id),
    ]);

    const removeConnection = () => {
      this.connections.delete(connection.id);
      connection.removeEventListener("close", removeConnection);
      connection.removeEventListener("error", removeConnection);
    };
    connection.addEventListener("close", removeConnection);
    connection.addEventListener("error", removeConnection);
  }
}

/**
 * When opting into hibernation, the platform tracks connections for us.
 */
export class HibernatingConnectionManager implements ConnectionManager {
  constructor(private controller: DurableObjectState) {}

  getCount() {
    return Number(this.controller.getWebSockets().length);
  }

  getConnection(id: string) {
    // TODO: Should we cache the connections?
    const sockets = this.controller.getWebSockets(id);
    if (sockets.length === 0) return undefined;
    if (sockets.length === 1) return createLazyConnection(sockets[0]);

    throw new Error(
      `More than one connection found for id ${id}. Did you mean to use getConnections(tag) instead?`
    );
  }

  getConnections(tag?: string | undefined) {
    return new HibernatingConnectionIterator(this.controller, tag);
  }

  legacy_getConnectionMap() {
    const connections = new Map();
    for (const connection of this.getConnections()) {
      connections.set(connection.id, connection);
    }
    return connections;
  }

  accept(connection: Party.Connection, userTags: string[]) {
    // dedupe tags in case user already provided id tag
    const tags = [
      connection.id,
      ...userTags.filter((t) => t !== connection.id),
    ];

    // validate tags against documented restrictions
    // shttps://developers.cloudflare.com/durable-objects/api/hibernatable-websockets-api/#state-methods-for-websockets
    if (tags.length > 10) {
      throw new Error(
        "A connection can only have 10 tags, including the default id tag."
      );
    }

    for (const tag of tags) {
      if (typeof tag !== "string") {
        throw new Error(`A connection tag must be a string. Received: ${tag}`);
      }
      if (tag === "") {
        throw new Error(`A connection tag must not be an empty string.`);
      }
      if (tag.length > 256) {
        throw new Error(`A connection tag must not exceed 256 characters`);
      }
    }

    this.controller.acceptWebSocket(connection, tags);
    connection.serializeAttachment({
      __pk: {
        id: connection.id,
        uri: connection.uri,
      },
      __user: null,
    });
  }
}
