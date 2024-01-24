import { webcrypto as crypto } from "node:crypto";

import { PKCE_CHARSET } from "./user";

/**
 * Generates random state to be passed for anti-csrf.
 * extracted from  user.tsx to make it possible to
 * mock the generated URL
 */
export function generateRandomState(lengthOfState: number): string {
  const output = new Uint32Array(lengthOfState);
  crypto.getRandomValues(output);
  return Array.from(output)
    .map((num: number) => PKCE_CHARSET[num % PKCE_CHARSET.length])
    .join("");
}
