import type * as Party from "partykit/server";

import { createRequestHandler as createRemixRequestHandler } from "./cf";

import type { AppLoadContext, ServerBuild } from "./cf";

/**
 * A function that returns the value to use as `context` in route `loader` and
 * `action` functions.
 *
 * You can think of this as an escape hatch that allows you to pass
 * environment/platform-specific values through to your loader/action.
 */
export type GetLoadContextFunction = (
  req: Party.Request,
  lobby: Party.FetchLobby,
  ctx: Party.ExecutionContext
) => Promise<AppLoadContext> | AppLoadContext;

export type RequestHandler = (
  req: Party.Request,
  lobby: Party.FetchLobby,
  ctx: Party.ExecutionContext
) => Promise<Response>;

/**
 * Returns a request handler for the PartyKit runtime that serves the
 * Remix SSR response.
 */
export function createRequestHandler({
  build,
  getLoadContext,
  mode
}: {
  build: ServerBuild;
  getLoadContext?: GetLoadContextFunction;
  mode?: string;
}): RequestHandler {
  const handleRequest = createRemixRequestHandler(build, mode);

  return async (
    req: Party.Request,
    lobby: Party.FetchLobby,
    ctx: Party.ExecutionContext
  ) => {
    const loadContext = await getLoadContext?.(req, lobby, ctx);

    return handleRequest(req as unknown as Request, loadContext);
  };
}

export * from "./cf";
