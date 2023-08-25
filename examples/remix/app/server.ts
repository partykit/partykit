import { createRequestHandler, logDevReady } from "partymix";
import * as build from "@remix-run/dev/server-build";

// import { createCookie } from "../src/cf";

import type {
  PartyExecutionContext,
  PartyFetchLobby,
  PartyRequest,
  PartyServer,
  PartyWorker,
} from "partykit/server";

if (process.env.NODE_ENV === "development") {
  logDevReady(build);
}

const handleRequest = createRequestHandler({ build });

export default class MyRemix implements PartyServer {
  static onFetch(
    request: PartyRequest,
    lobby: PartyFetchLobby,
    ctx: PartyExecutionContext
  ) {
    return handleRequest(request, lobby, ctx);
  }
}

MyRemix satisfies PartyWorker;
