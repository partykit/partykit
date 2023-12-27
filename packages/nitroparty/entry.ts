/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable react-hooks/rules-of-hooks */
import "#internal/nitro/virtual/polyfill";
import type * as Party from "partykit/server";

// @ts-expect-error polyfilled by nitro
const nitroApp = useNitroApp();

export default class PartyServer implements Party.Server {
  static onFetch(request: Party.Request) {
    const url = new URL(request.url);
    return nitroApp.localFetch(url.pathname + url.search, {
      context: {},
      host: url.hostname,
      protocol: url.protocol,
      method: request.method,
      // we need to cast the headers to a web standard Headers
      headers: request.headers as unknown as Headers,
      body: undefined,
    });
  }
}

PartyServer satisfies Party.Worker;
