import * as log from "../test_deps";
import { type EventsMap } from "./event-emitter";

import type { EventEmitter } from "./event-emitter";

export function enableLogs() {
  return log.setup({
    handlers: {
      console: new log.handlers.ConsoleHandler("DEBUG")
    },
    loggers: {
      "engine.io": {
        level: "ERROR", // set to "DEBUG" to display the Engine.IO logs
        handlers: ["console"]
      },
      "socket.io": {
        level: "ERROR", // set to "DEBUG" to display the Socket.IO logs
        handlers: ["console"]
      }
    }
  });
}

export function createPartialDone(
  count: number,
  resolve: () => void,
  reject: (reason: string) => void
) {
  let i = 0;
  return () => {
    if (++i === count) {
      resolve();
    } else if (i > count) {
      reject(`called too many times: ${i} > ${count}`);
    }
  };
}

export async function runHandshake(
  port: number,
  namespace = "/"
): Promise<string[]> {
  // Engine.IO handshake
  const response = await fetch(
    `http://localhost:${port}/socket.io/?EIO=4&transport=polling`,
    {
      method: "get"
    }
  );

  const sid = await parseSessionID(response);

  // Socket.IO handshake
  await eioPush(port, sid, namespace === "/" ? "40" : `40${namespace},`);
  const body = await eioPoll(port, sid);
  // might be defined if an event is emitted in the "connection" handler
  const firstPacket = body.substring(33); // length of '40{"sid":"xxx"}' + 1 for the separator character

  return [sid, firstPacket];
}

export function waitFor<T>(
  emitter: EventEmitter<EventsMap, EventsMap>,
  event: string
): Promise<T> {
  return new Promise((resolve) => {
    emitter.once(event, resolve);
  });
}

export function sleep(duration: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, duration));
}

export async function parseSessionID(response: Response): Promise<string> {
  const body = await response.text();
  return JSON.parse(body.substring(1)).sid;
}

export async function eioPoll(port: number, sid: string) {
  const response = await fetch(
    `http://localhost:${port}/socket.io/?EIO=4&transport=polling&sid=${sid}`,
    {
      method: "get"
    }
  );

  return response.text();
}

export async function eioPush(port: number, sid: string, body: BodyInit) {
  const response = await fetch(
    `http://localhost:${port}/socket.io/?EIO=4&transport=polling&sid=${sid}`,
    {
      method: "post",
      body
    }
  );

  // consume the response body
  await response.body?.cancel();
}
