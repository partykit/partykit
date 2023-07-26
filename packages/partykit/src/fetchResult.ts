import assert from "assert";
import type { RequestInit } from "undici";
import { fetch } from "undici";
import { version as packageVersion } from "../package.json";

declare const PARTYKIT_API_BASE: string | undefined;
assert(PARTYKIT_API_BASE, "PARTYKIT_API_BASE is not defined");

const API_BASE = process.env.PARTYKIT_API_BASE || PARTYKIT_API_BASE;

export async function fetchResult<T>(
  api: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${API_BASE}${api}`, {
    ...options,
    headers: {
      ...(typeof options.body === "string"
        ? { "Content-Type": "application/json" }
        : {}),
      Accept: "application/json",
      "User-Agent": `partykit/${packageVersion}`,
      ...options.headers,
    },
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
