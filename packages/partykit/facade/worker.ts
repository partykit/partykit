import type * as Party from "../src/server";

/**
 * Provides a standard interface to userland server implementations
 */
export type PartyServerAPI = Required<Omit<Party.Server, "options">> & {
  supportsHibernation: boolean;
};

/**
 * Module (non-class) server implementation
 */
export class ModuleWorker implements PartyServerAPI {
  options: Party.ServerOptions = {};
  supportsHibernation: boolean;

  constructor(
    private worker: Party.PartyKitServer,
    readonly room: Party.Room
  ) {
    this.supportsHibernation =
      "onMessage" in worker || !(`onConnect` in worker);
  }

  onStart() {
    // no-op
  }

  onConnect(ws: Party.Connection, ctx: Party.ConnectionContext) {
    if (this.worker.onConnect) {
      return this.worker.onConnect(ws, this.room, ctx);
    }
  }
  onMessage(message: string | ArrayBuffer, ws: Party.Connection) {
    if (this.worker.onMessage) {
      return this.worker.onMessage(message, ws, this.room);
    }
  }
  onClose(ws: Party.Connection) {
    if (this.worker.onClose) {
      return this.worker.onClose(ws, this.room);
    }
  }
  onError(ws: Party.Connection, err: Error) {
    if (this.worker.onError) {
      return this.worker.onError(ws, err, this.room);
    }
  }
  onRequest(req: Party.Request) {
    if (this.worker.onRequest) {
      return this.worker.onRequest(req, this.room);
    }
    return new Response("Invalid onRequest handler", {
      status: 500
    });
  }
  onAlarm() {
    if (this.worker.onAlarm) {
      return this.worker.onAlarm(this.room);
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
  private worker: Party.Server;
  options: Party.ServerOptions;
  supportsHibernation: boolean;

  constructor(
    private Worker: Party.Worker,
    readonly room: Party.Room
  ) {
    this.worker = new Worker(room);
    this.options = this.worker.options ?? {};
    this.supportsHibernation = this.options.hibernate === true;
  }
  onStart() {
    if (this.worker.onStart) {
      return this.worker.onStart();
    }
  }
  onConnect(ws: Party.Connection, ctx: Party.ConnectionContext) {
    if (this.worker.onConnect) {
      return this.worker.onConnect(ws, ctx);
    }
  }
  onMessage(message: string | ArrayBuffer, ws: Party.Connection) {
    if (this.worker.onMessage) {
      return this.worker.onMessage(message, ws);
    }
  }
  onClose(ws: Party.Connection) {
    if (this.worker.onClose) {
      return this.worker.onClose(ws);
    }
  }
  onError(ws: Party.Connection, err: Error) {
    if (this.worker.onError) {
      return this.worker.onError(ws, err);
    }
  }
  onRequest(req: Party.Request) {
    if (this.worker.onRequest) {
      return this.worker.onRequest(req);
    }
    return new Response("Invalid onRequest handler", {
      status: 500
    });
  }
  onAlarm() {
    if (this.worker.onAlarm) {
      return this.worker.onAlarm();
    }
  }
  getConnectionTags(
    connection: Party.Connection,
    context: Party.ConnectionContext
  ) {
    if (this.worker.getConnectionTags) {
      return this.worker.getConnectionTags(connection, context);
    }

    return [];
  }
}
