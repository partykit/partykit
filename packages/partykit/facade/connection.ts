import type { PartyConnection, PartyKitConnection } from "../src/server";

/** Fields that are stored and rehydrates when a durable object hibernates */
type ConnectionFields = {
  id: string;
  uri: string;
};

const attachments = new WeakMap<WebSocket, ConnectionFields>();
function deserializeAttachment(ws: WebSocket): ConnectionFields {
  let attachment = attachments.get(ws);
  if (!attachment) {
    attachment = ws.deserializeAttachment() as ConnectionFields;
    attachments.set(ws, attachment);
  }

  return attachment;
}

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

class PartyConnectionIterator implements IterableIterator<PartyConnection> {
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

export class HibernatingConnectionManager implements ConnectionManager {
  constructor(private controller: DurableObjectState) {}

  getConnection(id: string) {
    // TODO: Should we cache the connections
    const sockets = this.controller.getWebSockets(id);
    if (sockets.length === 0) return undefined;
    if (sockets.length === 1) return createLazyConnection(sockets[0]);

    throw new Error(
      `More than one connection found for id ${id}. Did you mean to use getConnections(tag) instead?`
    );
  }

  getConnections(tag?: string | undefined) {
    return new PartyConnectionIterator(this.controller, tag);
  }

  legacy_getConnectionMap() {
    const connections = new Map();
    for (const connection of this.getConnections()) {
      connections.set(connection.id, connection);
    }
    return connections;
  }

  accept(connection: PartyConnection, tags: string[]) {
    this.controller.acceptWebSocket(connection, [
      connection.id,
      ...tags.filter((t) => t !== connection.id),
    ]);
    connection.serializeAttachment({
      id: connection.id,
      uri: connection.uri,
    });
  }
}
