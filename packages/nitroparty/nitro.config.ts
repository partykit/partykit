import type { Nitro, NitroPreset } from "nitropack";
import { fileURLToPath } from "node:url";

export default <NitroPreset>{
  // extends: null,
  node: false,
  entry: fileURLToPath(new URL("./entry.ts", import.meta.url)),
  minify: true,
  hooks: {
    async compiled(_nitro: Nitro) {
      // no op
    },
  },
};
