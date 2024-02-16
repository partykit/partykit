import starlight from "@astrojs/starlight";
import tailwind from "@astrojs/tailwind";
import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
  site: "https://docs.partykit.io",
  integrations: [
    starlight(
      {
        title: "🎈 PartyKit Docs",
        description: "Collaborative applications are the future of software",
        customCss: ["./src/fonts/font-face.css", "./src/styles/custom.css"],
        head: [
          {
            tag: "script",
            content:
              "window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };"
          },
          {
            tag: "script",
            attrs: {
              src: "/_vercel/insights/script.js",
              defer: true
            }
          }
        ],
        social: {
          github: "https://github.com/partykit/partykit",
          discord: "https://discord.gg/KDZb7J4uxJ",
          twitter: "https://twitter.com/partykit_io"
        },
        editLink: {
          baseUrl: "https://github.com/partykit/partykit/tree/main/apps/docs"
        },
        lastUpdated: true,
        sidebar: [
          {
            label: "Get Started",
            items: [
              {
                label: "Quickstart",
                link: "/quickstart/"
              },
              {
                label: "Add to existing project",
                link: "/add-to-existing-project/"
              },
              {
                label: "What is PartyKit",
                link: "/"
              },
              {
                label: "How PartyKit works",
                link: "/how-partykit-works/"
              }
            ]
          },
          {
            label: "API Reference",
            autogenerate: {
              directory: "reference"
            }
          },
          {
            label: "Guides",
            autogenerate: {
              directory: "guides"
            }
          },
          {
            label: "Examples",
            collapsed: true,
            items: [
              {
                label: "All PartyKit Examples",
                link: "/examples/"
              },
              {
                label: "App examples",
                autogenerate: {
                  directory: "examples/app-examples"
                }
              },
              {
                label: "Starter kits",
                collapsed: true,
                autogenerate: {
                  directory: "examples/starter-kits"
                }
              }
            ]
          },
          {
            label: "Tutorials",
            collapsed: true,
            items: [
              {
                label: "Add PartyKit to a Next.js app",
                collapsed: true,
                autogenerate: {
                  directory: "tutorials/add-partykit-to-a-nextjs-app"
                }
              }
            ]
          },
          {
            label: "Glossary",
            link: "/glossary"
          },
          {
            label: "Enterprise",
            link: "/enterprise"
          }
        ]
      },
      tailwind({
        applyBaseStyles: false
      })
    )
  ],
  // Process images with sharp: https://docs.astro.build/en/guides/assets/#using-sharp
  image: {
    service: {
      entrypoint: "astro/assets/services/sharp"
    }
  }
});
