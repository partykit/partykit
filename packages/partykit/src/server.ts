/// <reference types="@edge-runtime/types" />

export type PartyKitConnection = {
  id: string;
  socket: WebSocket;
};

export type PartyKitRoom = {
  id: string;
  connections: Map<string, PartyKitConnection>;
  env: Record<string, string>;
};

export type PartyKitServer = {
  onConnect: (ws: WebSocket, room: PartyKitRoom) => void;
  unstable_onValidate?: (req: Request) => Promise<boolean>;
};
