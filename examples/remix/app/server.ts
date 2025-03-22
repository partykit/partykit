// import { createCookie } from "../src/cf";

import { createRequestHandler, logDevReady } from "partymix";
import type * as Party from "partykit/server";
import * as build from "@remix-run/dev/server-build";

if (process.env.NODE_ENV === "development") {
  // @ts-expect-error boop
  logDevReady(build);
}

// @ts-expect-error boop
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
