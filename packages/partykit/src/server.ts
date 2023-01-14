/// <reference types="@edge-runtime/types" />

export type PartyKitConnection = {
  id: string;
  socket: WebSocket;
  unstable_initial: unknown;
};

export type PartyKitRoom = {
  id: string; // room id, usually a slug
  connections: Map<string, PartyKitConnection>;
  env: Record<string, string>; // use a .env file, or --var
};

export type PartyKitServer = {
  onConnect: (ws: WebSocket, room: PartyKitRoom) => void;
  onBeforeConnect?: (req: Request) => Promise<unknown>;
};
