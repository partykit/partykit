import assert from "assert";

import { fetch } from "undici";

import { version as packageVersion } from "../package.json";

import type { UserSession } from "./config";
import type { RequestInit } from "undici";

declare const PARTYKIT_API_BASE: string | undefined;
assert(PARTYKIT_API_BASE, "PARTYKIT_API_BASE is not defined");

export const API_BASE = process.env.PARTYKIT_API_BASE || PARTYKIT_API_BASE;

export type FetchInit = RequestInit & { user?: UserSession };

export async function fetchResult<T>(
  api: string,
  options: FetchInit = {}
): Promise<T> {
  const { user, ...fetchOptions } = options;
  const sessionToken = await user?.getSessionToken();

  const res = await fetch(`${API_BASE}${api}`, {
    ...fetchOptions,
    headers: {
      Accept: "application/json",
      "User-Agent": `partykit/${packageVersion}`,
      "X-PartyKit-Version": packageVersion,
      "X-CLOUDFLARE-ACCOUNT-ID": process.env.CLOUDFLARE_ACCOUNT_ID || "",
      "X-CLOUDFLARE-API-TOKEN": process.env.CLOUDFLARE_API_TOKEN || "",
      ...(typeof fetchOptions.body === "string"
        ? { "Content-Type": "application/json" }
        : {}),
      ...(user && sessionToken
        ? {
            Authorization: `Bearer ${sessionToken}`,
            "X-PartyKit-User-Type": user.type
          }
        : {}),
      ...(fetchOptions.headers ?? {})
    }
  });
  if (res.ok) {
    const resJson = (await res.json()) as T;
    return resJson; // TODO: check json success/error response
  } else {
    let errorText;
    try {
      errorText = await res.text();
    } catch (e) {
      errorText = `${res.status} ${res.statusText}`;
    }
    throw new Error(errorText);
  }
}
