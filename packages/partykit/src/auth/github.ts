import chalk from "chalk";
import open from "open";
import { fetch } from "undici";

import { version as packageVersion } from "../../package.json";
import { userConfigSchema } from "../config";
import * as ConfigSchema from "../config-schema";
import countdown from "../countdown";

import type { UserConfig } from "../config";

export const configSchema = ConfigSchema.schema;
export type Config = ConfigSchema.Config;

const GITHUB_APP_ID = "670a9f76d6be706f5209";

export async function signInWithGitHub(): Promise<UserConfig> {
  // run github's oauth device flow
  // https://docs.github.com/en/developers/apps/building-oauth-apps/authorizing-oauth-apps#device-flow
  const res = await fetch("https://github.com/login/device/code", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "User-Agent": `partykit/${packageVersion}`,
      "X-PartyKit-Version": packageVersion
    },
    body: JSON.stringify({
      client_id: GITHUB_APP_ID
    })
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
    `We will now open your browser to ${chalk.bold(
      verification_uri
    )}\nPlease paste the code ${chalk.bold(
      user_code
    )} (copied to your clipboard) and authorize the app.`
  );

  await countdown("Opening browser", 5);

  console.log(`Waiting for you to authorize...`);

  // we do this because for some reason the clipboardy package doesn't work
  // with a direct import up top
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore kill me, bring me sweet release of death please
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
        "User-Agent": `partykit/${packageVersion}`,
        "X-PartyKit-Version": packageVersion
      },
      body: JSON.stringify({
        client_id: GITHUB_APP_ID,
        device_code,
        grant_type: "urn:ietf:params:oauth:grant-type:device_code"
      })
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
          "User-Agent": `partykit/${packageVersion}`,
          "X-PartyKit-Version": packageVersion
        }
      })
    ).json()) as { login: string };

    if (access_token) {
      return userConfigSchema.parse({
        access_token,
        login: githubUserDetails.login,
        type: "github"
      });
    }

    if (error === "authorization_pending") {
      // try again in a bit
      await new Promise((resolve) => setTimeout(resolve, interval * 1000));
      continue;
    }

    throw new Error(`Unexpected error: ${error}`);
  }

  throw new Error("Login failed.");
}
