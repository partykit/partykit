import { createPartialDone } from "misc/util.test";
import { serve } from "vitest";

import type { Server } from "../lib/server";

export function setup(
  server: Server,
  count: number,
  callback: (port: number, partialDone: () => void) => Promise<void> | void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const abortController = new AbortController();

    serve(server.handler(), {
      onListen: ({ port }) => {
        const partialDone = createPartialDone(
          count,
          () => {
            setTimeout(() => {
              // close the server
              abortController.abort();
              server.close();

              setTimeout(resolve, 10);
            }, 10);
          },
          reject
        );

        return callback(port, partialDone);
      },
      signal: abortController.signal
    });
  });
}
