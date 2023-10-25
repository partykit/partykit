import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import tailwind from "@astrojs/tailwind";

// https://astro.build/config
export default defineConfig({
  site: "https://docs.partykit.io",
  integrations: [
    starlight(
      {
        title: "PartyKit Docs",
        description: "Collaborative applications are the future of software.",
        customCss: ["./src/styles/custom.css"],
        head: [
          {
            tag: 'script',
            content: 'window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };'
          },
          {
            tag: 'script',
            attrs: {
              src: '/_vercel/insights/script.js',
              defer: true,
            },
          },
        ],
        social: {
          github: "https://github.com/partykit/partykit",
          discord: "https://discord.gg/KDZb7J4uxJ",
          twitter: "https://twitter.com/partykit_io",
        },
        editLink: {
          baseUrl: "https://github.com/partykit/partykit/tree/main/apps/docs",
        },
        lastUpdated: true,
        sidebar: [
          {
            label: "Get Started",
            items: [
              {
                label: "What is PartyKit",
                link: "/",
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
            autogenerate: {
              directory: "guides",
            },
          },
          {
            label: "Examples",
            collapsed: true,
            autogenerate: {
              directory: "examples",
            },
          },
          {
            label: "Tutorials",
            collapsed: true,
            items: [
              {
                label: "Before you begin",
                link: "/tutorials/before-you-begin"
              },
              {
                label: "Add PartyKit to a Next.js app",
                collapsed: true,
                autogenerate: {
                  directory: "tutorials/add-partykit-to-a-nextjs-app",
                },
              },
              {
                label: "Deploy your PartyKit server",
                link: "/tutorials/deploy-your-partykit-server"
              },
            ]
          },
          {
            label: "API Reference",
            collapsed: true,
            autogenerate: {
              directory: "reference",
            },
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
