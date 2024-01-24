import { fileURLToPath } from "node:url";

import type { Nitro, NitroPreset } from "nitropack";

export default <NitroPreset>{
  // extends: null,
  node: false,
  entry: fileURLToPath(new URL("./entry.js", import.meta.url)),
  minify: true,
  hooks: {
    async compiled(_nitro: Nitro) {
      // no op
    }
  }
};
