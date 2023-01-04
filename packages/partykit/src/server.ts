/// <reference types="@edge-runtime/types" />

type Connection = {
  id: string;
  socket: WebSocket;
};

type Room = {
  id: string;
  connections: Map<string, Connection>;
};

export type PartyKitServer = {
  onConnect: (room: Room, ws: WebSocket) => void;
  unstable_onValidate: (req: Request) => Promise<boolean>;
};
