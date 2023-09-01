import { defineConfig } from "astro/config";

import react from "@astrojs/react";

// https://astro.build/config
export default defineConfig({
  markdown:   {
    syntaxHighlight: 'prism',
  },
  integrations: [react()],
});
