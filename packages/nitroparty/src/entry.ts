/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable react-hooks/rules-of-hooks */
import "#internal/nitro/virtual/polyfill";

import type * as Party from "partykit/server";

// @ts-expect-error polyfilled by nitro
const nitroApp = useNitroApp();

const METHOD_WITH_BODY_RE = /post|put|patch/i;

function requestHasBody(request: Party.Request): boolean {
  return METHOD_WITH_BODY_RE.test(request.method);
}

export default class PartyServer implements Party.Server {
  static async onFetch(
    request: Party.Request,
    lobby: Party.FetchLobby,
    ctx: Party.ExecutionContext
  ) {
    const url = new URL(request.url);

    let body;
    if (requestHasBody(request)) {
      body = Buffer.from(await request.arrayBuffer());
    }
    return nitroApp.localFetch(url.pathname + url.search, {
      context: {
        request,
        lobby,
        ctx
      },
      host: url.hostname,
      protocol: url.protocol,
      method: request.method,
      // we need to cast the headers to a web standard Headers
      headers: request.headers as unknown as Headers,
      body
    });
  }
}

PartyServer satisfies Party.Worker;
