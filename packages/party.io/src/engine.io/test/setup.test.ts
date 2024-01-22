import { createPartialDone } from "misc/util.test";
import { serve } from "vitest";

import { Server } from "../lib/server";

export function setup(
  engine: Server,
  count: number,
  callback: (port: number, partialDone: () => void) => Promise<void> | void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const abortController = new AbortController();

    serve(engine.handler(), {
      onListen: ({ port }) => {
        const partialDone = createPartialDone(
          count,
          () => {
            // close the server
            abortController.abort();
            engine.close();
            setTimeout(resolve, 10);
          },
          reject
        );

        return callback(port, partialDone);
      },
      signal: abortController.signal
    });
  });
}
