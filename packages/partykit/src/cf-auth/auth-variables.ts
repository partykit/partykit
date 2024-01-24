/**
 * `CLOUDFLARE_ACCOUNT_ID` overrides the account inferred from the current user.
 */
export const getCloudflareAccountIdFromEnv = () =>
  process.env.CLOUDFLARE_ACCOUNT_ID;

export const getCloudflareAPITokenFromEnv = () =>
  process.env.CLOUDFLARE_API_TOKEN;

export const getCloudflareGlobalAuthKeyFromEnv = () =>
  process.env.CLOUDFLARE_API_KEY;

export const getCloudflareGlobalAuthEmailFromEnv = () =>
  process.env.CLOUDFLARE_EMAIL;

/**
 * `A UUID that is used to identify PartyKit to the Cloudflare APIs.
 */
export const getClientIdFromEnv = () => "54d11594-84e4-41aa-b438-e81b8fa78ee7";

/**
 * The URL base domain that is used to access
 * OAuth URLs for the Cloudflare APIs.
 */
export const getAuthDomainFromEnv = () => "dash.cloudflare.com";

/**
 * The path that is used to access OAuth
 * for the Cloudflare APIs.
 */
export const getAuthUrlFromEnv = () =>
  `https://${getAuthDomainFromEnv()}/oauth2/auth`;

/**
 * The path that is used to exchange an OAuth
 * token for an API token.
 */
export const getTokenUrlFromEnv = () =>
  `https://${getAuthDomainFromEnv()}/oauth2/token`;

/**
 * The path that is used to exchange an OAuth
 * refresh token for a new OAuth token.
 */
export const getRevokeUrlFromEnv = () =>
  `https://${getAuthDomainFromEnv()}/oauth2/revoke`;
