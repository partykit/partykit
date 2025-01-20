import ClerkImplementation from "@clerk/clerk-js/headless";
import chalk from "chalk";

import { logger } from "../logger";

import type Clerk from "@clerk/clerk-js";

declare const PARTYKIT_CLERK_PUBLISHABLE_KEY: string | undefined;
const PUBLISHABLE_KEY =
  process.env.PARTYKIT_CLERK_PUBLISHABLE_KEY || PARTYKIT_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error("PARTYKIT_CLERK_PUBLISHABLE_KEY not defined");
}

global.window = global.window || {};

type TokenStore = {
  token?: string;
};

const clerkFactory = ({ publishableKey }: { publishableKey: string }) => {
  /**
   * The Clerk CLI is meant for browser use, and relies on cookies by default.
   * Here we make it work by passing the token in the Authorization header instead.
   */
  return async ({
    tokenStore,
    headers = {}
  }: {
    tokenStore: TokenStore;
    headers?: Record<string, string>;
  }): Promise<Clerk> => {
    const clerk: Clerk = new ClerkImplementation(publishableKey);
    // pass captured or provided token in subsequent requests
    clerk.__unstable__onBeforeRequest(async (requestInit) => {
      requestInit.credentials = "omit";
      requestInit.url?.searchParams.append("_is_native", "1");
      const requestHeaders = requestInit.headers as Headers;
      requestHeaders.set("authorization", tokenStore.token || "");
      requestHeaders.set("user-agent", "partykit-cli");
      for (const key in headers) {
        requestHeaders.set(key, headers[key]);
      }
    });

    // capture token from responses for future use
    clerk.__unstable__onAfterResponse(async (_, response) => {
      const authHeader = response?.headers.get("authorization");
      if (authHeader) {
        tokenStore.token = authHeader;
      }
    });

    // nuclear timeout: if you're not connected to the internet (or clerk)
    // isn't reachable, clerk.load will hang forever. Throwing an error is
    // not sufficient because the headless browser has internal timeouts
    // that keep the process alive.
    //
    // This leaves us no choice: we must burn it all down.
    const timeout = setTimeout(() => {
      logger.log(chalk.bold("Authentication timed out."));
      logger.log("Make sure you are connected to the internet any try again.");
      process.exit(1);
    }, 3000);

    await clerk.load({ standardBrowser: false });

    clearTimeout(timeout);

    return clerk;
  };
};

export const createClerkClient = clerkFactory({
  publishableKey: PUBLISHABLE_KEY
});

export const fetchClerkClientToken = async (
  signInToken: string,
  headers?: Record<string, string>
) => {
  // the login process will populate the token in this object
  const tokenStore = {
    token: undefined
  };

  const clerk = await createClerkClient({ tokenStore, headers });
  const res = await clerk.client?.signIn.create({
    strategy: "ticket",
    ticket: signInToken
  });

  if (res && res.status !== "complete") {
    throw new Error(`Flow did not complete: ${JSON.stringify(res)}`);
  }

  if (!tokenStore.token) {
    throw new Error("No client token received");
  }

  // `clerk.session` won't be populated on device, but activeSessions are
  const session = clerk.client?.activeSessions?.[0];
  if (!session || !session.user) {
    throw new Error("No session created");
  }

  return {
    access_token: tokenStore.token,
    username: session.user.username
  };
};

export const expireClerkClientToken = async (
  clientToken: string,
  headers?: Record<string, string>
) => {
  const tokenStore = {
    token: clientToken
  };

  const clerk = await createClerkClient({ tokenStore, headers });
  await clerk.signOut();
};
