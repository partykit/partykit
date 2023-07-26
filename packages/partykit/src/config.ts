import log from "why-is-node-running";

import fs from "fs";
import os from "os";
import path from "path";
import * as dotenv from "dotenv";
import { z } from "zod";
import JSON5 from "json5";
import chalk from "chalk";
import findConfig from "find-config";
import { fetch } from "undici";
import open from "open";
import { version as packageVersion } from "../package.json";
import { ConfigurationError, logger } from "./logger";
import countdown from "./countdown";

import * as ConfigSchema from "./config-schema";

export const configSchema = ConfigSchema.schema;

export type Config = ConfigSchema.Config;
import { fetchClerkSessionToken } from "./auth/clerk";
import { signInWithBrowser } from "./auth/device";

const userConfigSchema = z.object({
  login: z.string(),
  access_token: z.string(),
  type: z.string(),
});

export type UserConfig = z.infer<typeof userConfigSchema>;

const USER_CONFIG_PATH = path.join(os.homedir(), ".partykit", "config.json");

export async function getUser(): Promise<UserConfig> {
  let userConfig;
  try {
    userConfig = getUserConfig();
  } catch (e) {
    console.log("Attempting to login...");
    await fetchUserConfig();
    userConfig = getUserConfig();
  }
  return userConfig;
}

export function getUserConfig(): UserConfig {
  if (process.env.PARTYKIT_TOKEN) {
    return {
      login: null, // TODO
      access_token: process.env.PARTYKIT_TOKEN,
      type: "partykit",
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

const GITHUB_APP_ID = "670a9f76d6be706f5209";

import process from "process";

export async function fetchUserConfig(): Promise<void> {
  const signInToken = await signInWithBrowser();

  // console.log("signInToken", signInToken);
  // const signInToken =
  //   "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJlaXMiOjYwMCwiZXhwIjoxNjkwMzc2MDAzLCJpaWQiOiJpbnNfMlBORzJoS0tQTlRtWXdCRkdsRk0xWlNCMDZCIiwic2lkIjoic2l0XzJUNnRZQzQ3Y1pqZnpvbFd1Q213ZWRGc2sxeSIsInN0Ijoic2lnbl9pbl90b2tlbiJ9.ojPn-lbxxqIRMe-4fHTcJUUoXKq8Iwo2skAqBAa3L52xKMOfUAJxDTUxtceZGF_8DfsamucZ5NHLtt-8iLTMxWAotP_grGT-nAgu85Ro3KMF7JVADv3gzyN1-pe_6Q0lxu_1aRfxTX8YZ8e1hIuKK6SSyfj46RtAqsM2I8FpYPgQmFvTtu-frB9SxBTJA8-tjQJGRyjtRhTPPfomxvpT0xOScnaJQqpfovidHhqRj0Vf_8RgxPyuwQjc7VOVrAbuIUEkpHilvaBk55rK79gNuvJa_7E3LGCj11MnJ_1W89y5Y2UeSpz7dkCsh7Q4Oixc5oKkJ8JM1qXQC6oUIGqzlw";
  // console.log("signInToken", signInToken);

  const accessToken = await fetchClerkSessionToken(signInToken);
  //const accessToken =
  //  "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImNsaWVudF8yVDZlTDZFd3NjOXVISFBnN3JNNUg1RGRsWXciLCJyb3RhdGluZ190b2tlbiI6IjV6MTBrODA1YmY3Y3JxaXozNjlqZjdvcTczdHJoeGJuN2gwZWVubWIifQ.R-bqSR8fGV7_b9_-N4SCtHJq3tfHCLPqDc0r19p3MwwQupXPWl8KhYxUMQrJNAwQ4MNhKOLcLjlmKvhtsxxm-bBeDV59iikO_oYkkQU8PpIME9u_xSx9McIH-l0tOxG0MohtA2J5j_BkaMoqcx10mfwfDLchCt3dvsiTSe3Ouk-iTDPWCOS_M5MuMbCSU1m6zon6LL08iMRv73J4EqdBtyyma21Y63HOM6jG4S6t3l2GeqsXP-Fg54hfgVpSaNKOo-qga-jzoDzTbHzZK4Wmh3Fezfo7pR_uD9vmxXs1vOXu5qyZe8i8mb-CpWn_51XOpvg5JTZeR4KTFacdWoIQoQ";
  // console.log("accessToken", accessToken);

  // log();

  if (accessToken) {
    // now write the token to the config file at ~/.partykit/config.json
    fs.mkdirSync(path.dirname(USER_CONFIG_PATH), { recursive: true });
    fs.writeFileSync(
      USER_CONFIG_PATH,
      JSON.stringify(
        userConfigSchema.parse({
          access_token: accessToken,
          login: "jevakallio", // todo
          type: "partykit",
        }),
        null,
        2
      )
    );
  }
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
