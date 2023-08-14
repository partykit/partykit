import type Clerk from "@clerk/clerk-js";
import clerk from "@clerk/clerk-js/headless/index.js";

const ClerkConstructor = clerk.default;

global.window = global.window || {};

type TokenStore = {
  token?: string;
};

const CLERK_PUBLISHABLE_KEY =
  "pk_test_b2JsaWdpbmctc25pcGUtMzcuY2xlcmsuYWNjb3VudHMuZGV2JA";

const clerkFactory = ({ publishableKey }: { publishableKey: string }) => {
  return async ({ tokenStore }: { tokenStore: TokenStore }): Promise<Clerk> => {
    const clerk: Clerk = new ClerkConstructor(publishableKey);
    clerk.__unstable__onBeforeRequest(async (requestInit) => {
      requestInit.credentials = "omit";
      requestInit.url?.searchParams.append("_is_native", "1");
      (requestInit.headers as Headers).set(
        "authorization",
        tokenStore.token || ""
      );
    });

    clerk.__unstable__onAfterResponse(async (_, response) => {
      const authHeader = response?.headers.get("authorization");
      if (authHeader) {
        tokenStore.token = authHeader;
      }
    });

    await clerk.load({ standardBrowser: false });

    return clerk;
  };
};

export const createClerkClient = clerkFactory({
  publishableKey: CLERK_PUBLISHABLE_KEY,
});

export const fetchClerkClientToken = async (signInToken: string) => {
  const tokenStore = {
    token: undefined,
  };

  const clerk = await createClerkClient({ tokenStore });
  const res = await clerk.client?.signIn.create({
    strategy: "ticket",
    ticket: signInToken,
  });

  if (res && res.status !== "complete") {
    throw new Error(`Flow did not complete: ${JSON.stringify(res)}`);
  }

  if (!tokenStore.token) {
    throw new Error("No client token received");
  }

  // `clerk.session` won't be populated on device, but session should exist
  const session = clerk.client?.activeSessions?.[0];
  if (!session || !session.user) {
    throw new Error("No session created");
  }

  return {
    access_token: tokenStore.token,
    username: session.user.username,
  };
};
