import fs from "fs";
import os from "os";
import path from "path";
import * as dotenv from "dotenv";
import { z } from "zod";
import JSON5 from "json5";
import { findUpSync } from "find-up";
import { ConfigurationError, logger } from "./logger";
import chalk from "chalk";
import { getFlags } from "./featureFlags";

import * as ConfigSchema from "./config-schema";

export const configSchema = ConfigSchema.schema;

export type Config = ConfigSchema.Config;

import {
  createClerkClient,
  expireClerkClientToken,
  fetchClerkClientToken,
} from "./auth/clerk";
import { signInWithBrowser } from "./auth/device";
import { signInWithGitHub } from "./auth/github";

export const userConfigSchema = z.object({
  /** @deprecated use team and username instead */
  // eslint-disable-next-line deprecation/deprecation
  login: z.string(),
  access_token: z.string(),
  type: z.enum(["clerk", "github"]),

  // TODO: make fields non-nullable when GitHub logins are deprecated
  username: z.string().optional(),
  team: z.string().optional(),
});

export type UserConfig = z.infer<typeof userConfigSchema>;
export type UserSession = UserConfig & {
  getSessionToken(): Promise<string>;
};

export type LoginMethod = UserConfig["type"];

const USER_CONFIG_PATH = path.join(os.homedir(), ".partykit", "config.json");
export async function getUser(
  loginMethod?: LoginMethod,
  exact: boolean = false
): Promise<UserSession> {
  const flags = getFlags();
  const method = loginMethod ?? flags.defaultLoginMethod;

  // load persisted config, or create a new session if valid session doesn't exist
  let userConfig: UserConfig;

  try {
    userConfig = getUserConfig();

    if (!flags.supportedLoginMethods.includes(userConfig.type)) {
      throw new Error(
        `Login method ${userConfig.type} is no longer supported, logging in again.`
      );
    }

    if (exact && method !== userConfig.type) {
      throw new Error(
        `User has logged in using another method, logging in again`
      );
    }
  } catch (e) {
    console.log("Attempting to login...");
    userConfig = await fetchUserConfig(method);
    if (!userConfig) {
      throw new Error("Login failed. Please try again.");
    }

    // now write the token to the config file at ~/.partykit/config.json
    fs.mkdirSync(path.dirname(USER_CONFIG_PATH), { recursive: true });
    fs.writeFileSync(USER_CONFIG_PATH, JSON.stringify(userConfig, null, 2));
  }

  // for clerk tokens, we need to exchange the client token for a session token,
  // which are only valid for 1 minute at a time
  if (userConfig.type === "clerk") {
    const clerk = await createClerkClient({
      tokenStore: {
        token: userConfig.access_token,
      },
    });

    return {
      ...userConfig,
      async getSessionToken() {
        // For Clerk logins, get a session token from the client token.
        // The session tokens are valid for 1 minute, but we want to make sure
        // that long-running API calls have time to make the subrequests they need
        // so we will refresh the token every 30 seconds.
        const sessionToken = await clerk.session?.getToken({
          leewayInSeconds: 30,
        });

        if (!sessionToken) {
          throw new Error("Session expired. Please log in again.");
        }

        return sessionToken;
      },
    };
  } else {
    return {
      ...userConfig,
      async getSessionToken() {
        // for GitHub logins, we use the access token as auth token directly
        return userConfig.access_token;
      },
    };
  }
}

export function readUserConfig(path: string): UserConfig | null {
  if (!fs.existsSync(path)) {
    return null;
  }

  const config = JSON5.parse(fs.readFileSync(path, "utf8"));
  return userConfigSchema.parse(config);
}

export function getUserConfig(): UserConfig {
  if (process.env.PARTYKIT_TOKEN && process.env.PARTYKIT_LOGIN) {
    return {
      login: process.env.PARTYKIT_LOGIN,
      access_token: process.env.PARTYKIT_TOKEN,
      type: "clerk",
      username: process.env.PARTYKIT_LOGIN,
      team: process.env.PARTYKIT_TEAM, // optional
    };
  }

  if (process.env.GITHUB_TOKEN && process.env.GITHUB_LOGIN) {
    return {
      login: process.env.GITHUB_LOGIN,
      access_token: process.env.GITHUB_TOKEN,
      type: "github",
    };
  }

  const config = readUserConfig(USER_CONFIG_PATH);
  if (!config) {
    throw new Error(
      `No User configuration was found, please run ${chalk.bold(
        "npx partykit login"
      )}.`
    );
  }

  return config;
}

// this isn't super useful since we're validating on the server
// export async function validateUserConfig(config: UserConfig): Promise<boolean> {
//   const res = await fetch(`https://api.github.com/user`, {
//     headers: {
//       Authorization: `Bearer ${config.access_token}`,
//     },
//   });
//   if (
//     res.ok &&
//     config.login &&
//     // eslint-disable-next-line @typescript-eslint/no-explicit-any
//     ((await res.json()) as any).login === config.login
//   ) {
//     return true;
//   }
//   return false;
// }

import process from "process";

export async function createClerkSession({
  mode,
}: {
  mode: "cli" | "token";
}): Promise<UserConfig> {
  // initiate login oauth login flow
  const signInResult = await signInWithBrowser(mode);

  // if the user aborts the login flow, there's nowhere to go,
  // so exit gracefully
  if ("aborted" in signInResult) {
    logger.info("User aborted login flow in the browser.");
    process.exit(0);
  }

  // This label is used to identify the token in the clerk dashboard.
  // Clerk dashboard only shows first word, so don't use spaces
  const label = mode === "cli" ? "partykit-cli" : "partykit-token";
  const user = await fetchClerkClientToken(signInResult.token, {
    "User-Agent": label,
  });

  if (user) {
    return userConfigSchema.parse({
      type: "clerk",
      team: signInResult.teamId,
      username: user.username,
      access_token: user.access_token,

      // `login` is used for backwards compatibility with old github config.
      // going forward, we should use team and username explicitly
      login: signInResult.teamId,
    });
  }

  throw new Error("Login failed.");
}

export async function createClerkClientSession() {
  return createClerkSession({ mode: "cli" });
}

export async function createClerkServiceTokenSession() {
  return createClerkSession({ mode: "token" });
}

export async function fetchUserConfig(
  method: LoginMethod
): Promise<UserConfig> {
  // TODO: Remove when GitHub login is deprecated
  if (method === "github") {
    return signInWithGitHub();
  }

  return createClerkClientSession();
}

export async function logout() {
  const config = readUserConfig(USER_CONFIG_PATH);
  if (config) {
    fs.rmSync(USER_CONFIG_PATH);
    if (config.type === "clerk") {
      try {
        await expireClerkClientToken(config.access_token);
      } catch (e) {
        logger.info(chalk.dim("You were logged out this device."));
      }
    }
  }
  // TODO: delete the token from github
}

function replacePathSlashes(str: string) {
  return str.replace(/\\/g, "/");
}

export type ConfigOverrides = Config; // Partial? what of .env?

export function getConfigPath() {
  return (
    findUpSync("partykit.json") ||
    findUpSync("partykit.json5") ||
    findUpSync("partykit.jsonc")
  );
}

function removeUndefinedKeys(obj: Record<string, unknown> | undefined) {
  return obj === undefined
    ? obj
    : Object.fromEntries(
        Object.entries(obj).filter(([, value]) => value !== undefined)
      );
}

export function getConfig(
  configPath: string | undefined | null,
  overrides: ConfigOverrides = {},
  options?: { readEnvLocal?: boolean }
): Config {
  const envPath = findUpSync(".env");
  const envLocalPath = findUpSync(".env.local");
  let envVars: Record<string, string> = {};
  if (envPath) {
    console.log(
      `Loading environment variables from ${path.relative(
        process.cwd(),
        envPath
      )}`
    );
    envVars = dotenv.parse(fs.readFileSync(envPath, "utf8"));
  }
  if (envLocalPath && options?.readEnvLocal) {
    console.log(
      `Loading environment variables from ${path.relative(
        process.cwd(),
        envLocalPath
      )}`
    );
    envVars = {
      ...envVars,
      ...dotenv.parse(fs.readFileSync(envLocalPath, "utf8")),
    };
  }

  configPath ||= getConfigPath();

  // do a quick check of the overrides
  configSchema.parse(overrides);

  if (!configPath) {
    if (overrides.account) {
      console.warn('configuration field "account" is not yet operational');
    }

    let packageJsonConfig = {} as ConfigOverrides;
    const packageJsonPath = findUpSync("package.json");
    if (packageJsonPath) {
      packageJsonConfig =
        JSON.parse(fs.readFileSync(packageJsonPath, "utf8")).partykit || {};
      // @ts-expect-error partykit is our special field in package.json
      if (packageJsonConfig.partykit) {
        logger.debug(
          `Loading config from ${path.relative(
            process.cwd(),
            packageJsonPath
          )}#partykit`
        );
      }
    }

    const config = configSchema.parse({
      // defaults?
      ...removeUndefinedKeys(packageJsonConfig),
      ...removeUndefinedKeys(overrides),
      vars: {
        ...removeUndefinedKeys(packageJsonConfig.vars),
        ...removeUndefinedKeys(envVars),
        ...removeUndefinedKeys(overrides.vars),
      },
      define: {
        ...removeUndefinedKeys(packageJsonConfig.define),
        ...removeUndefinedKeys(overrides.define),
      },
    });

    if (config.main) {
      // make the path absolute
      const absoluteMainPath = path.isAbsolute(config.main)
        ? config.main
        : path.join(process.cwd(), config.main);

      if (!fs.existsSync(absoluteMainPath)) {
        throw new ConfigurationError(`Could not find main: ${config.main}`);
      } else {
        config.main =
          "./" +
          replacePathSlashes(path.relative(process.cwd(), absoluteMainPath));
      }
    }

    return config;
  }
  logger.debug(
    `Loading config from ${path.relative(process.cwd(), configPath)}`
  );

  const parsedConfig = JSON5.parse(fs.readFileSync(configPath, "utf8"));

  // do a quick check of the parsed object
  configSchema.parse(parsedConfig);

  const config = configSchema.parse({
    ...removeUndefinedKeys(parsedConfig),
    ...removeUndefinedKeys(overrides),
    vars: {
      ...removeUndefinedKeys(parsedConfig.vars),
      ...removeUndefinedKeys(envVars),
      ...removeUndefinedKeys(overrides.vars),
    },
    define: {
      ...removeUndefinedKeys(parsedConfig.define),
      ...removeUndefinedKeys(overrides.define),
    },
  });

  if (config.account) {
    console.warn('Configuration field "account" is not yet operational');
  }

  if (config.main) {
    if (overrides.main) {
      const absoluteMainPath = path.isAbsolute(overrides.main)
        ? overrides.main
        : path.join(process.cwd(), overrides.main);
      if (!fs.existsSync(absoluteMainPath)) {
        throw new ConfigurationError(`Could not find main: ${overrides.main}`);
      } else {
        config.main =
          "./" +
          replacePathSlashes(path.relative(process.cwd(), absoluteMainPath));
      }
    } else if (parsedConfig.main) {
      const absoluteMainPath = path.isAbsolute(parsedConfig.main)
        ? parsedConfig.main
        : path.join(path.dirname(configPath), parsedConfig.main);
      if (!fs.existsSync(absoluteMainPath)) {
        throw new ConfigurationError(
          `Could not find main: ${parsedConfig.main}`
        );
      } else {
        config.main =
          "./" +
          replacePathSlashes(path.relative(process.cwd(), absoluteMainPath));
      }
    }
  }
  if (config.parties) {
    for (const [name, party] of Object.entries(config.parties)) {
      const absolutePartyPath = path.isAbsolute(party)
        ? party
        : path.join(path.dirname(configPath), party);
      if (!fs.existsSync(absolutePartyPath)) {
        throw new ConfigurationError(`Could not find party: ${party}`);
      } else {
        config.parties[name] =
          "./" +
          replacePathSlashes(path.relative(process.cwd(), absolutePartyPath));
      }
    }
  }

  if (config.parties?.main) {
    throw new ConfigurationError(`Cannot have a party named "main"`);
  }

  return config;
}
