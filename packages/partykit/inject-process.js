/* global PARTYKIT_PROCESS_ENV */
import * as process from "node:process";

try {
  Object.assign(process.env, JSON.parse(PARTYKIT_PROCESS_ENV));
} catch (err) {
  // no-op
}

export { process };
