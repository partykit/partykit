---
author: Sat Naing
pubDatetime: 2022-09-25T15:20:35Z
title: Customizing AstroPaper theme color schemes
postSlug: ""
featured: false
draft: false
tags:
  - color-schemes
  - docs
ogImage: ""
description:
  How you can enable/disable light & dark mode; and customize color schemes
  of AstroPaper theme.
---

This post will explain how you can enable/disable light & dark mode for the website. Moreover, you'll learn how you can customize color schemes of the entire website.

## Table of contents

## Enable/disable light & dark mode

AstroPaper theme will include light and dark mode by default. In other words, there will be two color schemes\_ one for light mode and another for dark mode. This default behavior can be disabled in SITE configuration object of the `src/config.ts` file.

```js
// file: src/config.ts
export const SITE = {
  website: "https://astro-paper.pages.dev/",
  author: "Sat Naing",
  desc: "A minimal, responsive and SEO-friendly Astro blog theme.",
  title: "AstroPaper",
  ogImage: "astropaper-og.jpg",
  lightAndDarkMode: true, // true by default
  postPerPage: 3,
};
```

To disable `light & dark mode` set `SITE.lightAndDarkMode` to `false`.

## Choose primary color scheme

By default, if we disable `SITE.lightAndDarkMode`, we will only get system's prefers-color-scheme.

Thus, to choose primary color scheme instead of prefers-color-scheme, we have to set color scheme in the primaryColorScheme variable inside `public/toggle-theme.js`.

```js
/* file: public/toggle-theme.js */
const primaryColorScheme = ""; // "light" | "dark"

// Get theme data from local storage
const currentTheme = localStorage.getItem("theme");

// other codes etc...
```

The **primaryColorScheme** variable can hold two values\_ `"light"`, `"dark"`. You can leave the empty string (default) if you don't want to specify the primary color scheme.

- `""` - system's prefers-color-scheme. (default)
- `"light"` - use light mode as primary color scheme.
- `"dark"` - use dark mode as primary color scheme.

<details><summary>Why 'primaryColorScheme' is not inside config.ts?</summary>

> To avoid color flickering on page reload, we have to place the toggle-switch JavaScript codes as early as possible when the page loads. It solves the problem of flickering, but as a trade-off, we cannot use ESM imports anymore.

[Click here](https://docs.astro.build/en/reference/directives-reference/#isinline) to know more about Astro's `is:inline` script.

</details>

## Customize color schemes

Both light & dark color schemes of AstroPaper theme can be customized. You can do this in `src/styles/base.css` file.

```css
/* file: src/styles/base.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root,
  html[data-theme="light"] {
    --color-fill: 251, 254, 251;
    --color-text-base: 40, 39, 40;
    --color-accent: 0, 108, 172;
    --color-card: 230, 230, 230;
    --color-card-muted: 205, 205, 205;
    --color-border: 236, 233, 233;
  }
  html[data-theme="dark"] {
    --color-fill: 47, 55, 65;
    --color-text-base: 230, 230, 230;
    --color-accent: 26, 217, 217;
    --color-card: 63, 75, 90;
    --color-card-muted: 89, 107, 129;
    --color-border: 59, 70, 85;
  }
  /* other styles */
}
```

In AstroPaper theme, `:root` and `html[data-theme="light"]` selectors are used as the light color scheme and `html[data-theme="dark"]` is used the dark color scheme. If you want to customize your custom color scheme, you have to specify your light color scheme inside `:root`,`html[data-theme="light"]` and dark color scheme inside `html[data-theme="dark"]`.

Colors are declared in CSS custom property (CSS Variable) notation. Color property values are written in rgb values. (Note: instead of `rgb(40, 39, 40)`, only specify `40, 39, 40`)

Here is the detail explanation of color properties.

| Color Property       | Definition & Usage                                         |
| -------------------- | ---------------------------------------------------------- |
| `--color-fill`       | Primary color of the website. Usually the main background. |
| `--color-text-base`  | Secondary color of the website. Usually the text color.    |
| `--color-accent`     | Accent color of the website. Link color, hover color etc.  |
| `--color-card`       | Card, scrollbar and code background color (like `this`).   |
| `--color-card-muted` | Card and scrollbar background color for hover state etc.   |
| `--color-border`     | Border color. Especially used in horizontal row (hr)       |

Here is an example of changing the light color scheme.

```css
@layer base {
  /* lobster color scheme */
  :root,
  html[data-theme="light"] {
    --color-fill: 246, 238, 225;
    --color-text-base: 1, 44, 86;
    --color-accent: 225, 74, 57;
    --color-card: 220, 152, 145;
    --color-card-muted: 233, 119, 106;
    --color-border: 220, 152, 145;
  }
}
```

> Check out some [predefined color schemes](https://astro-paper.pages.dev/posts/predefined-color-schemes/) AstroPaper has already crafted for you.
