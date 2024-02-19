import type { Config as TailwindConfig } from "tailwindcss";
import starlightPlugin from "@astrojs/starlight-tailwind";

const config = {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  plugins: [starlightPlugin()]
} satisfies TailwindConfig;

export default config;
