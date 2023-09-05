import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import tailwind from "@astrojs/tailwind";

// https://astro.build/config
export default defineConfig({
  integrations: [
    starlight(
      {
        title: "PartyKit Docs",
        description: "Collaborative applications are the future of software.",
        // logo: '',
        // Relative path to your custom CSS file
        customCss: ["./src/styles/custom.css"],

        social: {
          github: "https://github.com/partykit/docs",
          discord: "https://discord.gg/KDZb7J4uxJ",
          twitter: "https://twitter.com/partykit_io",
        },
        editLink: {
          baseUrl: "https://github.com/partykit/docs/edit/main/",
        },
        lastUpdated: true,
        sidebar: [
          {
            label: "Get Started",
            items: [
              {
                label: "What is PartyKit",
                link: "/what-is-partykit/",
              },
              {
                label: "Quickstart",
                link: "/quickstart/",
              },
              {
                label: "How PartyKit works",
                link: "/how-partykit-works/",
              },
            ],
          },
          {
            label: "Guides",
            collapsed: true,
            autogenerate: {
              directory: "guides",
            },
          },
          {
            label: "Examples",
            autogenerate: {
              directory: "examples",
            },
          },
          // {
          //   label: "Tutorial",
          //   collapsed: true,
          //   items: [
          //     {
          //       label: "1. Build a realtime chat app",
          //       link: "/tutorial/1-build-a-realtime-chat-app",
          //     },
          //   ],
          // },
          {
            label: "API Reference",
            collapsed: true,
            autogenerate: {
              directory: "reference",
            },
            // items: [
            //   {
            //     label: "Overview",
            //     link: "/reference/partykit-api-overview",
            //   },
            //   {
            //     label: "PartyKit CLI",
            //     link: "/reference/partykit-cli",
            //   },
            //   {
            //     label: "PartyServer (Server API)",
            //     link: "/reference/partyserver-api",
            //   },
            //   {
            //     label: "PartySocket (Client API)",
            //     link: "/reference/partysocket-api",
            //   },
            //   {
            //     label: "Configuration",
            //     link: "/reference/partykit-configuration",
            //   },
            //   {
            //     label: "Y-Partykit API",
            //     link: "/reference/y-partykit-api",
            //   },
            // ],
          },
          {
            label: "Glossary",
            link: "/glossary",
          },
          {
            label: "Enterprise",
            link: "/enterprise",
          },
        ],
      },
      tailwind({
        applyBaseStyles: false,
      })
    ),
  ],
  // Process images with sharp: https://docs.astro.build/en/guides/assets/#using-sharp
  image: {
    service: {
      entrypoint: "astro/assets/services/sharp",
    },
  },
});
