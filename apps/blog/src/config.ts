import type { Site, SocialObjects } from "./types";

export const SITE: Site = {
  website: "https://blog.partykit.io/",
  author: "PartyKit, Inc.",
  desc: "Everything is better with friends who read and write.",
  title: "PartyKit Blog",
  ogImage: "astropaper-og.jpg",
  lightAndDarkMode: true,
  postPerPage: 10,
};

export const LOCALE = ["en-GB"]; // set to [] to use the environment default

export const LOGO_IMAGE = {
  enable: false,
  svg: true,
  width: 216,
  height: 46,
};

export const SOCIALS: SocialObjects = [
  {
    name: "Github",
    href: "https://github.com/partykit/partykit",
    linkTitle: ` ${SITE.title} on Github`,
    active: true,
  },
  {
    name: "Mail",
    href: "mailto:contact@partykit.io",
    linkTitle: `Send an email to ${SITE.title}`,
    active: true,
  },
  {
    name: "Twitter",
    href: "https://twitter.com/partykit_io",
    linkTitle: `${SITE.title} on Twitter`,
    active: true,
  },
  {
    name: "Discord",
    href: "https://discord.gg/g5uqHQJc3z",
    linkTitle: `${SITE.title} on Discord`,
    active: true,
  },
  {
    name: "Rss",
    href: "https://blog.partykit.io/rss.xml",
    linkTitle: `Follow ${SITE.title} on RSS`,
    active: true,
  },
];
