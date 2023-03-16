/// <reference types="@edge-runtime/types" />

export type PartyKitConnection = {
  id: string;
  socket: WebSocket;
  unstable_initial: unknown;
};

export type PartyKitStorage = {
  get<T = unknown>(key: string): Promise<T | undefined>;
  get<T = unknown>(keys: string[]): Promise<Map<string, T>>;
  list<T = unknown>(options?: {
    start?: string;
    startAfter?: string;
    end?: string;
    prefix?: string;
    reverse?: boolean;
    limit?: number;
  }): Promise<Map<string, T>>;
  put<T>(key: string, value: T): Promise<void>;
  put<T>(entries: Record<string, T>): Promise<void>;
  delete(key: string): Promise<boolean>;
  delete(keys: string[]): Promise<number>;
  deleteAll(): Promise<void>;
  // getAlarm(): Promise<number | null>;
  // setAlarm(scheduledTime: number | Date): Promise<void>;
  // deleteAlarm(): Promise<void>;
};

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
    room: { id: string; env: Record<string, unknown> }
  ) => Initial | Promise<Initial>;

  onBeforeRequest?: (
    req: Request,
    room: { id: string; env: Record<string, unknown> }
  ) => Request | Promise<Request> | Response | Promise<Response>;
  onRequest?: (
    req: Request,
    room: PartyKitRoom
  ) => Response | Promise<Response>;
};
