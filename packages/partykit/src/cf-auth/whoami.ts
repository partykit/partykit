import chalk from "chalk";

import { getUser } from "../config";
import { fetchResult } from "../fetchResult";
import { getAPIToken, getAuthFromEnv, getScopes } from "./user";

export async function whoami() {
  console.log("Getting User settings...");
  const user = await getUserInfo();
  if (user === undefined) {
    return void console.log(
      "You are not authenticated. Please run `partykit login --cloudflare`."
    );
  }
  if (user.email !== undefined) {
    console.log(
      `\nYou are logged in with an ${
        user.authType
      }, associated with the email ${chalk.blue(user.email)}\n`
    );
  } else {
    console.log(
      `\nYou are logged in with an ${user.authType}. Unable to retrieve email for this user. Are you missing the \`User->User Details->Read\` permission?\n`
    );
  }
  console.table(
    user.accounts.map((account) => ({
      "Account Name": account.name,
      "Account ID": account.id
    }))
  );
  console.log("\n");
  const permissions =
    user.tokenPermissions?.map((scope) => scope.split(":")) ?? [];

  if (user.authType !== "OAuth Token") {
    return void console.log(
      `🔓 To see token permissions visit https://dash.cloudflare.com/profile/api-tokens`
    );
  }
  console.log(
    `🔓 Token Permissions: If scopes are missing, you may need to logout and re-login.`
  );
  console.log(`Scope (Access)`);
  for (const [scope, access] of permissions) {
    console.log(`- ${scope} ${access ? `(${access})` : ``}`);
  }
}

type AuthType = "Global API Key" | "API Token" | "OAuth Token";
export interface UserInfo {
  apiToken: string;
  authType: AuthType;
  email: string | undefined;
  accounts: AccountInfo[];
  tokenPermissions: string[] | undefined;
}

export async function getUserInfo(): Promise<UserInfo | undefined> {
  const apiToken = getAPIToken();
  if (!apiToken) return;

  const tokenPermissions = await getTokenPermissions();

  const usingEnvAuth = !!getAuthFromEnv();
  const usingGlobalAuthKey = "authKey" in apiToken;
  return {
    apiToken: usingGlobalAuthKey ? apiToken.authKey : apiToken.apiToken,
    authType: usingGlobalAuthKey
      ? "Global API Key"
      : usingEnvAuth
        ? "API Token"
        : "OAuth Token",
    email: "authEmail" in apiToken ? apiToken.authEmail : await getEmail(),
    accounts: await getAccounts(),
    tokenPermissions
  };
}

async function getEmail(): Promise<string | undefined> {
  const user = await getUser();
  try {
    const { result } = await fetchResult<{ result: { email: string } }>(
      // eslint-disable-next-line deprecation/deprecation
      `/cf/${user.login}/user`,
      {
        user
      }
    );
    const { email } = result;
    return email;
  } catch (e) {
    if ((e as { code?: number }).code === 9109) {
      return undefined;
    } else {
      throw e;
    }
  }
}

type AccountInfo = { name: string; id: string };

async function getAccounts(): Promise<AccountInfo[]> {
  const user = await getUser();
  const response = await fetchResult<{ result: AccountInfo[] }>(
    // eslint-disable-next-line deprecation/deprecation
    `/cf/${user.login}/accounts`,
    { user }
  );
  return response.result;
}

async function getTokenPermissions(): Promise<string[] | undefined> {
  // Tokens can either be API tokens or Oauth tokens.
  // Here we only extract permissions from OAuth tokens.

  return getScopes() as string[];
}
