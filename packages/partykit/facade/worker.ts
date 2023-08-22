import type {
  Party,
  PartyKitConnection,
  PartyKitContext,
  PartyKitRoom,
  PartyKitServer,
  PartyRequest,
  PartyServer,
  PartyServerConstructor,
  PartyServerOptions,
} from "../src/server";

/**
 * Provides a standard interface to userland server implementations
 */
export type PartyServerAPI = Required<Omit<PartyServer, "options">> & {
  supportsHibernation: boolean;
};

/**
 * Module (non-class) server implementation
 */
export class ModuleWorker implements PartyServerAPI {
  options: PartyServerOptions = {};
  supportsHibernation: boolean;

  constructor(private worker: PartyKitServer, readonly party: Party) {
    this.supportsHibernation =
      "onMessage" in worker || !(`onConnect` in worker);
  }

  onStart() {
    // no-op
  }

  onConnect(ws: PartyKitConnection, ctx: PartyKitContext) {
    if (this.worker.onConnect) {
      return this.worker.onConnect(ws, this.party, ctx);
    }
  }
  onMessage(message: string | ArrayBuffer, ws: PartyKitConnection) {
    if (this.worker.onMessage) {
      return this.worker.onMessage(message, ws, this.party);
    }
  }
  onClose(ws: PartyKitConnection) {
    if (this.worker.onClose) {
      return this.worker.onClose(ws, this.party);
    }
  }
  onError(ws: PartyKitConnection, err: Error) {
    if (this.worker.onError) {
      return this.worker.onError(ws, err, this.party);
    }
  }
  onRequest(req: PartyRequest) {
    if (this.worker.onRequest) {
      return this.worker.onRequest(req, this.party);
    }
    return new Response("Invalid onRequest handler", {
      status: 500,
    });
  }
  onAlarm(room: Omit<PartyKitRoom, "id">) {
    if (this.worker.onAlarm) {
      return this.worker.onAlarm(room);
    }
  }
  getConnectionTags(): string[] | Promise<string[]> {
    return [];
  }
}

/**
 * Class server implementation
 */
export class ClassWorker implements PartyServerAPI {
  private worker: PartyServer;
  options: PartyServerOptions;
  supportsHibernation: boolean;

  constructor(private Worker: PartyServerConstructor, readonly party: Party) {
    this.worker = new Worker(party);
    this.options = this.worker.options ?? {};
    this.supportsHibernation = this.options.hibernate === true;
  }
  onStart() {
    if (this.worker.onStart) {
      return this.worker.onStart();
    }
  }
  onConnect(ws: PartyKitConnection, ctx: PartyKitContext) {
    if (this.worker.onConnect) {
      return this.worker.onConnect(ws, ctx);
    }
  }
  onMessage(message: string | ArrayBuffer, ws: PartyKitConnection) {
    if (this.worker.onMessage) {
      return this.worker.onMessage(message, ws);
    }
  }
  onClose(ws: PartyKitConnection) {
    if (this.worker.onClose) {
      return this.worker.onClose(ws);
    }
  }
  onError(ws: PartyKitConnection, err: Error) {
    if (this.worker.onError) {
      return this.worker.onError(ws, err);
    }
  }
  onRequest(req: PartyRequest) {
    if (this.worker.onRequest) {
      return this.worker.onRequest(req);
    }
    return new Response("Invalid onRequest handler", {
      status: 500,
    });
  }
  onAlarm(room: Omit<PartyKitRoom, "id">) {
    if (this.worker.onAlarm) {
      return this.worker.onAlarm(room);
    }
  }
  getConnectionTags(connection: PartyKitConnection) {
    if (this.worker.getConnectionTags) {
      return this.worker.getConnectionTags(connection);
    }

    return [];
  }
}
