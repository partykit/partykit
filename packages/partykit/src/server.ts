import type {
  DurableObjectStorage,
  ExecutionContext,
  Request,
  Response,
  WebSocket,
} from "@cloudflare/workers-types";

export type PartyKitStorage = DurableObjectStorage;

export type PartyKitRoom = {
  id: string; // room id, usually a slug
  internalID: string; // internal id
  connections: Map<string, PartyKitConnection>;
  env: Record<string, unknown>; // use a .env file, or --var
  storage: PartyKitStorage;
  broadcast: (msg: string, without: string[]) => void;
  getWebSockets: () => WebSocket[];
};

export type PartyKitConnection = WebSocket & {
  id: string;
  /**
   * @deprecated
   */
  room: {
    id: string;
    internalID: string;
    env: Record<string, unknown>;
  };
  socket: WebSocket;
  unstable_initial: unknown;
};

export type PartyKitServer<Initial = unknown> =
  | {
      onConnect?: (
        ws: PartyKitConnection,
        room: PartyKitRoom
      ) => void | Promise<void>;

      onBeforeConnect?: (
        req: Request,
        room: { id: string; env: Record<string, unknown> },
        ctx: ExecutionContext
      ) => Initial | Promise<Initial>;

      onBeforeRequest?: (
        req: Request,
        room: { id: string; env: Record<string, unknown> },
        ctx: ExecutionContext
      ) => Request | Promise<Request> | Response | Promise<Response>;

      onRequest?: (
        req: Request,
        room: PartyKitRoom
      ) => Response | Promise<Response>;
      onAlarm?: (room: Omit<PartyKitRoom, "id">) => void | Promise<void>;
    }
  | {
      onMessage?: (
        ws: PartyKitConnection,
        message: string | ArrayBuffer,
        room: PartyKitRoom
      ) => void | Promise<void>;
      onClose?: (ws: WebSocket, room: PartyKitRoom) => void | Promise<void>;
      onError?: (
        ws: PartyKitConnection,
        err: Error,
        room: PartyKitRoom
      ) => void | Promise<void>;
    };
