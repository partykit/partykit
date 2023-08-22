import type { PartyConnection, PartyKitConnection } from "../src/server";

/** Fields that are stored and rehydrates when a durable object hibernates */
type ConnectionFields = {
  id: string;
  uri: string;
};

/**
 * Cache websocket attachments to avoid having to rehydrate them on every property access.
 */
const attachments = new WeakMap<WebSocket, ConnectionFields>();
function deserializeAttachment(ws: WebSocket): ConnectionFields {
  let attachment = attachments.get(ws);
  if (!attachment) {
    // pick only known fields to avoid keeping user's attachments in memory
    const { id, uri } = ws.deserializeAttachment() as ConnectionFields;
    attachment = { id, uri };
    attachments.set(ws, attachment);
  }

  return attachment;
}

/**
 * Wraps a WebSocket with PartyConnection fields that rehydrate the
 * socket attachment lazily only when requested.
 */
export const createLazyConnection = (ws: WebSocket): PartyConnection => {
  return Object.assign(ws, {
    get id() {
      return deserializeAttachment(ws).id;
    },
    get uri() {
      return deserializeAttachment(ws).uri;
    },
    get socket() {
      return ws;
    },
  });
};

class HibernatingConnectionIterator
  implements IterableIterator<PartyConnection>
{
  private index: number = 0;
  private sockets: WebSocket[] | undefined;
  constructor(private state: DurableObjectState, private tag?: string) {}

  [Symbol.iterator](): IterableIterator<PartyKitConnection> {
    return this;
  }

  next(): IteratorResult<PartyKitConnection, number | undefined> {
    const sockets =
      this.sockets ?? (this.sockets = this.state.getWebSockets(this.tag));

    if (this.index >= sockets.length) {
      // reached the end of the iteratee
      return { done: true, value: undefined };
    }

    const value = createLazyConnection(this.sockets[this.index++]);
    return { done: false, value };
  }
}

export interface ConnectionManager {
  getConnection(id: string): PartyConnection | undefined;
  getConnections(tag?: string): IterableIterator<PartyConnection>;
  accept(connection: PartyConnection, tags: string[]): void;

  // This can be removed when Party.connections is removed
  legacy_getConnectionMap(): Map<string, PartyKitConnection>;
}

/**
 * When not using hibernation, we track active connections manually.
 */
export class InMemoryConnectionManager implements ConnectionManager {
  connections: Map<string, PartyConnection> = new Map();
  tags: WeakMap<PartyConnection, string[]> = new WeakMap();

  getConnection(id: string) {
    return this.connections.get(id);
  }

  *getConnections(tag?: string): IterableIterator<PartyConnection> {
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

  accept(connection: PartyKitConnection, tags: string[]): void {
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

  accept(connection: PartyConnection, userTags: string[]) {
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
      id: connection.id,
      uri: connection.uri,
    });
  }
}
