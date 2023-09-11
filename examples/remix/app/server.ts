import { createRequestHandler, logDevReady } from "partymix";
import * as build from "@remix-run/dev/server-build";

// import { createCookie } from "../src/cf";

import type * as Party from "partykit/server";

if (process.env.NODE_ENV === "development") {
  logDevReady(build);
}

const handleRequest = createRequestHandler({ build });

export default class MyRemix implements Party.Server {
  static onFetch(
    request: Party.Request,
    lobby: Party.FetchLobby,
    ctx: Party.ExecutionContext
  ) {
    return handleRequest(request, lobby, ctx);
  }
}

MyRemix satisfies Party.Worker;
