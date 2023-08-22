import type {
  Party,
  PartyConnection,
  PartyKitServer,
  PartyRequest,
  PartyServer,
  PartyWorker,
  PartyServerOptions,
  PartyConnectionContext,
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

  onConnect(ws: PartyConnection, ctx: PartyConnectionContext) {
    if (this.worker.onConnect) {
      return this.worker.onConnect(ws, this.party, ctx);
    }
  }
  onMessage(message: string | ArrayBuffer, ws: PartyConnection) {
    if (this.worker.onMessage) {
      return this.worker.onMessage(message, ws, this.party);
    }
  }
  onClose(ws: PartyConnection) {
    if (this.worker.onClose) {
      return this.worker.onClose(ws, this.party);
    }
  }
  onError(ws: PartyConnection, err: Error) {
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
  onAlarm() {
    if (this.worker.onAlarm) {
      return this.worker.onAlarm(this.party);
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

  constructor(private Worker: PartyWorker, readonly party: Party) {
    this.worker = new Worker(party);
    this.options = this.worker.options ?? {};
    this.supportsHibernation = this.options.hibernate === true;
  }
  onStart() {
    if (this.worker.onStart) {
      return this.worker.onStart();
    }
  }
  onConnect(ws: PartyConnection, ctx: PartyConnectionContext) {
    if (this.worker.onConnect) {
      return this.worker.onConnect(ws, ctx);
    }
  }
  onMessage(message: string | ArrayBuffer, ws: PartyConnection) {
    if (this.worker.onMessage) {
      return this.worker.onMessage(message, ws);
    }
  }
  onClose(ws: PartyConnection) {
    if (this.worker.onClose) {
      return this.worker.onClose(ws);
    }
  }
  onError(ws: PartyConnection, err: Error) {
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
  onAlarm() {
    if (this.worker.onAlarm) {
      return this.worker.onAlarm();
    }
  }
  getConnectionTags(
    connection: PartyConnection,
    context: PartyConnectionContext
  ) {
    if (this.worker.getConnectionTags) {
      return this.worker.getConnectionTags(connection, context);
    }

    return [];
  }
}
