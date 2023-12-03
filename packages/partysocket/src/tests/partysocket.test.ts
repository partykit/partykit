/**
 * @vitest-environment jsdom
 */

import {
  beforeEach,
  afterEach,
  test,
  expect,
  vitest,
  beforeAll,
  afterAll,
} from "vitest";
import PartySocket from "../index";
const PORT = 50123;
const URL = `localhost:${PORT}/`;

let wss: PartySocket;

beforeAll(() => {
  wss = new PartySocket({ host: URL });
});

afterEach(() => {
  vitest.restoreAllMocks();
});

test("throws if host or room is not set", () => {
  expect(() => {
    const partySocket = new PartySocket({ host: "" });
    partySocket.reconnect();
  }).toThrow();
});

test("if the room is correctly updated after calling updateProperties", () => {
  const partySocket = new PartySocket({ host: URL, room: "first-room" });
  partySocket.updateProperties({ room: "second-room" });
  expect(partySocket.room).toBe("second-room");
});
