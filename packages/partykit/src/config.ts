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

const userConfigSchema = z.object({
  login: z.string(),
  access_token: z.string(),
  type: z.string(),
});

export type UserConfig = z.infer<typeof userConfigSchema>;

const USER_CONFIG_PATH = path.join(os.homedir(), ".partykit", "config.json");

export function getUserConfig(): UserConfig {
  if (process.env.GITHUB_TOKEN && process.env.GITHUB_LOGIN) {
    return {
      login: process.env.GITHUB_LOGIN,
      access_token: process.env.GITHUB_TOKEN,
      type: "github",
    };
  }

  if (!fs.existsSync(USER_CONFIG_PATH)) {
    throw new Error("user config not available");
  }
  const config = JSON5.parse(fs.readFileSync(USER_CONFIG_PATH, "utf8"));
  return userConfigSchema.parse(config);
}

export async function validateUserConfig(config: UserConfig): Promise<boolean> {
  const res = await fetch(`https://api.github.com/user`, {
    headers: {
      Authorization: `Bearer ${config.access_token}`,
    },
  });
  if (
    res.ok &&
    config.login &&
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ((await res.json()) as any).login === config.login
  ) {
    return true;
  }
  return false;
}

const GITHUB_APP_ID = "670a9f76d6be706f5209";

export async function fetchUserConfig(): Promise<void> {
  // run github's oauth device flow
  // https://docs.github.com/en/developers/apps/building-oauth-apps/authorizing-oauth-apps#device-flow
  const res = await fetch("https://github.com/login/device/code", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: GITHUB_APP_ID,
    }),
  });

  if (!res.ok) {
    throw new Error(
      `Failed to get device code: ${res.status} ${res.statusText}`
    );
  }

  const { device_code, user_code, verification_uri, expires_in, interval } =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (await res.json()) as any;

  console.log(
    `Please visit ${chalk.bold(
      verification_uri
    )} and paste the code ${chalk.bold(user_code)}`
  );
  console.log(`This code will expire in ${expires_in} seconds`);
  console.log(`Waiting for you to authorize...`);

  // we do this because for some reason the clipboardy package doesn't work
  // with a direct import up top
  const { default: clipboardy } = await import("clipboardy");
  clipboardy.writeSync(user_code);

  open(verification_uri).catch(() => {
    console.error(
      `Failed to open ${verification_uri}, please copy the code ${user_code} to your clipboard`
    );
  });

  const start = Date.now();
  while (Date.now() - start < expires_in * 1000) {
    const res = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: GITHUB_APP_ID,
        device_code,
        grant_type: "urn:ietf:params:oauth:grant-type:device_code",
      }),
    });

    if (!res.ok) {
      throw new Error(
        `Failed to get access token: ${res.status} ${res.statusText}`
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { access_token, error } = (await res.json()) as any;

    // now get the username
    const githubUserDetails = (await (
      await fetch("https://api.github.com/user", {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      })
    ).json()) as { login: string };

    if (access_token) {
      // now write the token to the config file at ~/.partykit/config.json
      fs.mkdirSync(path.dirname(USER_CONFIG_PATH), { recursive: true });
      fs.writeFileSync(
        USER_CONFIG_PATH,
        JSON.stringify(
          userConfigSchema.parse({
            access_token,
            login: githubUserDetails.login,
            type: "github",
          }),
          null,
          2
        )
      );
      console.log(`Logged in as ${chalk.bold(githubUserDetails.login)}`);
      return;
    }
    if (error === "authorization_pending") {
      // try again in a bit
      await new Promise((resolve) => setTimeout(resolve, interval * 1000));
      continue;
    }
    throw new Error(`Unexpected error: ${error}`);
  }
}

export async function logout() {
  if (fs.existsSync(USER_CONFIG_PATH)) {
    fs.rmSync(USER_CONFIG_PATH);
  }
  // TODO: delete the token from github
  console.log("Logged out");
}

const configSchema = z.object({
  account: z.string().optional(),
  name: z.string().optional(),
  main: z.string().optional(),
  port: z.number().optional(),
  // assets: z.string().optional(),
  vars: z.record(z.unknown()).optional(),
  define: z.record(z.string()).optional(),
  // env: z
  //   .record(
  //     z.object({
  //       vars: z.record(z.unknown()).optional(),
  //     })
  //   )
  //   .optional(),
});

export type Config = z.infer<typeof configSchema>;

export type ConfigOverrides = Config; // Partial? what of .env?

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
  if (!configPath) {
    configPath = findConfig("partykit.json", { home: false });
  }
  if (!configPath) {
    configPath = findConfig("partykit.json5", { home: false });
  }
  if (!configPath) {
    configPath = findConfig("partykit.jsonc", { home: false });
  }

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
      if (packageJsonConfig) {
        console.log(
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

    if (!config.main) {
      throw new Error(
        'Missing entry point, please specify "main" in your config'
      );
    }

    // make the path absolute
    const absoluteMainPath = path.isAbsolute(config.main)
      ? config.main
      : path.join(process.cwd(), config.main);

    if (!fs.existsSync(absoluteMainPath)) {
      throw new Error(`Could not find main: ${config.main}`);
    } else {
      config.main = "./" + path.relative(process.cwd(), absoluteMainPath);
    }

    return config;
  }
  console.log(
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
    console.warn('configuration field "account" is not yet operational');
  }

  if (!config.main) {
    throw new Error(
      'Missing entry point, please specify "main" in your config'
    );
  }

  if (overrides.main) {
    const absoluteMainPath = path.isAbsolute(overrides.main)
      ? overrides.main
      : path.join(process.cwd(), overrides.main);
    if (!fs.existsSync(absoluteMainPath)) {
      throw new Error(`Could not find main: ${overrides.main}`);
    } else {
      config.main = "./" + path.relative(process.cwd(), absoluteMainPath);
    }
  } else if (parsedConfig.main) {
    const absoluteMainPath = path.isAbsolute(parsedConfig.main)
      ? parsedConfig.main
      : path.join(path.dirname(configPath), parsedConfig.main);
    if (!fs.existsSync(absoluteMainPath)) {
      throw new Error(`Could not find main: ${parsedConfig.main}`);
    } else {
      config.main = "./" + path.relative(process.cwd(), absoluteMainPath);
    }
  }
  return config;
}
