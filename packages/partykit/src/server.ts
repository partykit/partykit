/// <reference types="@edge-runtime/types" />

export type User = {};

export type Party = {
  users: User[];
  broadcast: typeof WebSocket.prototype.send;
};
