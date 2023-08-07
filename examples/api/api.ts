/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-empty-function */
import type { PartyKitConnection, PartyKitStorage } from "partykit/server";

export type Connection = PartyKitConnection;

type PartyKitContext = {};

export type Options = {
  /**
   * Controls whether or not the object should be unloaded from memory between executions...
   */
  hibernate?: boolean;
};

abstract class PartyKitServerImpl {
  options: Options = {
    hibernate: false,
  };

  protected id: string;
  protected connections: Map<string, Connection> = new Map();
  private _storage: PartyKitStorage;
  protected get storage() {
    if (!this._storage) throw new Error("Storage not initialized");
    return this._storage;
  }

  constructor(ctx: PartyKitContext) {
    this._storage = {} as PartyKitStorage;
    this.id = "";
  }

  broadcast() {
    // TODO
    this.connections;
  }
}

export abstract class PartyServer extends PartyKitServerImpl {
  onRequest(req: Request): Response | Promise<Response> {
    // @ts-expect-error returning request as sentinel that no handler was defined on the class
    return req;
  }

  onStart(): void | Promise<void> {}
  onConnect(connection: Connection): void | Promise<void> {}
  onClose(connection: Connection): void | Promise<void> {}
  onError(connection: Connection, err: Error): void | Promise<void> {}
  onMessage(
    connection: Connection,
    message: string | ArrayBuffer
  ): void | Promise<void> {}

  onAlarm() {}

  constructor(ctx: PartyKitContext) {
    super(ctx);
  }
}

type Async<T> = T | Promise<T>;
export type OnBeforeHandler = (
  req: Request
) => Async<Request> | Async<Response>;
