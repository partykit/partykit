import type {
  DurableObjectStorage,
  ExecutionContext,
  Request,
  Response,
  WebSocket,
} from "@cloudflare/workers-types";

export type PartyKitConnection = {
  id: string;
  socket: WebSocket;
  unstable_initial: unknown;
};

export type PartyKitStorage = DurableObjectStorage;

export type PartyKitRoom = {
  id: string; // room id, usually a slug
  connections: Map<string, PartyKitConnection>;
  env: Record<string, unknown>; // use a .env file, or --var
  storage: PartyKitStorage;
};

export type PartyKitServer<Initial = unknown> = {
  onConnect?: (ws: WebSocket, room: PartyKitRoom) => void | Promise<void>;
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
};
