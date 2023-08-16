import fs from "fs";
import os from "os";
import path from "path";
import * as dotenv from "dotenv";
import { z } from "zod";
import JSON5 from "json5";
import findConfig from "find-config";
import { ConfigurationError, logger } from "./logger";
import chalk from "chalk";
import { getFlags } from "./featureFlags";

import * as ConfigSchema from "./config-schema";

export const configSchema = ConfigSchema.schema;

export type Config = ConfigSchema.Config;

import { createClerkClient, fetchClerkClientToken } from "./auth/clerk";
import { signInWithBrowser } from "./auth/device";
import { signInWithGitHub } from "./auth/github";

export const userConfigSchema = z.object({
  /** @deprecated use team and username instead */
  login: z.string(),
  access_token: z.string(),
  type: z.enum(["clerk", "github"]),

  // TODO: make fields non-nullable when GitHub logins are deprecated
  username: z.string().optional(),
  team: z.string().optional(),
});

export type UserConfig = z.infer<typeof userConfigSchema>;
export type LoginMethod = UserConfig["type"];

const USER_CONFIG_PATH = path.join(os.homedir(), ".partykit", "config.json");
export async function getUser(loginMethod?: LoginMethod): Promise<UserConfig> {
  const flags = getFlags();
  const method = loginMethod ?? flags.defaultLoginMethod;

  // load persisted config, or create a new session if valid session doesn't exist
  let userConfig;

  try {
    userConfig = getUserConfig();
    if (!flags.supportedLoginMethods.includes(userConfig.type)) {
      throw new Error(
        `Login method ${userConfig.type} is not supported, logging in again.`
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

    const sessionToken = await clerk?.session?.getToken();
    if (!sessionToken) {
      throw new Error("Session expired. Please log in again.");
    }

    userConfig = {
      ...userConfig,
      access_token: sessionToken,
    };
  }

  return userConfig;
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

  if (!fs.existsSync(USER_CONFIG_PATH)) {
    throw new Error(
      `No User configuration was found, please run ${chalk.bold(
        "npx partykit login"
      )}.`
    );
  }
  const config = JSON5.parse(fs.readFileSync(USER_CONFIG_PATH, "utf8"));
  return userConfigSchema.parse(config);
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

export async function fetchUserConfig(
  method: LoginMethod
): Promise<UserConfig> {
  // TODO: Remove when GitHub login is deprecated
  if (method === "github") {
    return signInWithGitHub();
  }

  // initiate login oauth login flow
  const signInResult = await signInWithBrowser();

  // if the user aborts the login flow, there's nowhere to go,
  // so exit gracefully
  if ("aborted" in signInResult) {
    logger.info("User aborted login flow in the browser.");
    process.exit(0);
  }

  const user = await fetchClerkClientToken(signInResult.token);

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

export async function logout() {
  if (fs.existsSync(USER_CONFIG_PATH)) {
    fs.rmSync(USER_CONFIG_PATH);
  }
  // TODO: delete the token from github
}

function replacePathSlashes(str: string) {
  return str.replace(/\\/g, "/");
}

export type ConfigOverrides = Config; // Partial? what of .env?

export function getConfigPath() {
  return (
    findConfig("partykit.json", { home: false }) ||
    findConfig("partykit.json5", { home: false }) ||
    findConfig("partykit.jsonc", { home: false })
  );
}

export function getConfig(
  configPath: string | undefined | null,
  overrides: ConfigOverrides = {},
  options?: { readEnvLocal?: boolean }
): Config {
  const envPath = findConfig(".env");
  const envLocalPath = findConfig(".env.local");
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
    const packageJsonPath = findConfig("package.json", { home: false });
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
      ...packageJsonConfig,
      ...overrides,
      vars: {
        ...packageJsonConfig.vars,
        ...envVars,
        ...overrides.vars,
      },
      define: {
        ...packageJsonConfig.define,
        ...overrides.define,
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
    ...overrides,
    ...parsedConfig,
    vars: {
      ...parsedConfig.vars,
      ...envVars,
      ...overrides.vars,
    },
    define: {
      ...parsedConfig.define,
      ...overrides.define,
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
