import type { PartyConnection, PartyKitConnection } from "../src/server";

/** Fields that are stored and rehydrates when a durable object hibernates */
type SerializedConnectionFields = {
  id: string;
  uri: string;
};

const attachments = new WeakMap<WebSocket, SerializedConnectionFields>();
function deserializeAttachment(ws: WebSocket): SerializedConnectionFields {
  let attachment = attachments.get(ws);
  if (!attachment) {
    attachment = ws.deserializeAttachment() as SerializedConnectionFields;
    attachments.set(ws, attachment);
  }

  return attachment;
}

const createLazyConnection = (ws: WebSocket): PartyConnection => {
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

// TODO: Should we cache connections?
// const connections = new WeakMap<WebSocket, PartyConnection>();
// const getOrCreateLazyConnection = (ws: WebSocket): PartyConnection => {
//   let connection = connections.get(ws);
//   if (!connection) {
//     connection = createLazyConnection(ws);
//     connections.set(ws, connection);
//   }

//   return connection;
// };

class PartyConnectionIterator implements Iterator<PartyConnection> {
  private index: number = 0;
  private sockets: WebSocket[] | undefined;
  constructor(private state: DurableObjectState, private tag?: string) {}

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

export function getConnection(state: DurableObjectState, idTag: string) {
  // TODO: Should we cache the connections
  const sockets = state.getWebSockets(idTag);
  if (sockets.length === 0) {
    return undefined;
  }
  if (sockets.length === 1) {
    return createLazyConnection(sockets[0]);
  }
  throw new Error(
    `More than one connection found for id ${idTag}. Did you mean to use getConnections(tag) instead?`
  );
}

export function getConnections(state: DurableObjectState, tag?: string) {
  return new PartyConnectionIterator(state, tag);
}
