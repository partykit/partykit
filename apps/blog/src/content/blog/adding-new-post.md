---
author: Sat Naing
pubDatetime: 2022-09-23T15:22:00Z
title: Adding new posts in AstroPaper theme
postSlug: adding-new-posts-in-astropaper-theme
featured: true
draft: false
tags:
  - docs
ogImage: ""
description:
  Some rules & recommendations for creating or adding new posts using AstroPaper
  theme.
---

Here are some rules/recommendations, tips & ticks for creating new posts in AstroPaper blog theme.

## Table of contents

## Frontmatter

Frontmatter is the main place to store some important information about the post (article). Frontmatter lies at the top of the article and is written in YAML format. Read more about frontmatter and its usage in [astro documentation](https://docs.astro.build/en/guides/markdown-content/).

Here is the list of frontmatter property for each post.

| Property           | Description                                                                     | Remark                                        |
| ------------------ | ------------------------------------------------------------------------------- | --------------------------------------------- |
| **_title_**        | Title of the post. (h1)                                                         | required<sup>\*</sup>                         |
| **_description_**  | Description of the post. Used in post excerpt and site description of the post. | required<sup>\*</sup>                         |
| **_pubDatetime_**  | Published datetime in ISO 8601 format.                                          | required<sup>\*</sup>                         |
| **_author_**       | Author of the post.                                                             | default = SITE.author                         |
| **_postSlug_**     | Slug for the post. Will automatically be slugified.                             | default = slugified title                     |
| **_featured_**     | Whether or not display this post in featured section of home page               | default = false                               |
| **_draft_**        | Mark this post 'unpublished'.                                                   | default = false                               |
| **_tags_**         | Related keywords for this post. Written in array yaml format.                   | default = others                              |
| **_ogImage_**      | OG image of the post. Useful for social media sharing and SEO.                  | default = SITE.ogImage or generated SVG image |
| **_canonicalURL_** | Canonical URL (absolute), in case the article already exists on other source.   | default = `Astro.site` + `Astro.url.pathname` |

Only `title`, `description` and `pubDatetime` fields in frontmatter must be specified.

Title and description (excerpt) are important for search engine optimization (SEO) and thus AstroPaper encourages to include these in blog posts.

`slug` is the unique identifier of the url. Thus, `slug` must be unique and different from other posts. The whitespace of `slug` needs to be separated with `-` or `_` but `-` is recommended. However, even if you don't write the correct slug, AstroPaper will automatically slugify your incorrect slug. If slug is not specified, the slugified title of the post will be used as slug.

If you omit `tags` in a blog post (in other words, if no tag is specified), the default tag `others` will be used as a tag for that post. You can set the default tag in the `/src/content/_schemas.ts` file.

```ts
// src/contents/_schemas.ts
export const blogSchema = z.object({
  // ---
  // replace "others" with whatever you want
  tags: z.array(z.string()).default(["others"]),
  ogImage: z.string().optional(),
  description: z.string(),
});
```

### Sample Frontmatter

Here is the sample frontmatter for a post.

```yaml
# src/contents/sample-post.md
---
title: The title of the post
author: your name
pubDatetime: 2022-09-21T05:17:19Z
postSlug: the-title-of-the-post
featured: true
draft: false
tags:
  - some
  - example
  - tags
ogImage: ""
description: This is the example description of the example post.
canonicalURL: https://example.org/my-article-was-already-posted-here
---
```

## Adding table of contents

By default, a post (article) does not include any table of contents (toc). To include toc, you have to specify it in a specific way.

Write `Table of contents` in h2 format (## in markdown) and place it where you want it to be appeared on the post.

For instance, if you want to place your table of contents just under the intro paragraph (like I usually do), you can do that in the following way.

```md
---
# some frontmatter
---

Here are some recommendations, tips & ticks for creating new posts in AstroPaper blog theme.

## Table of contents

<!-- the rest of the post -->
```

## Headings

There's one thing to note about headings. The AstroPaper blog posts use title (title in the frontmatter) as the main heading of the post. Therefore, the rest of the heading in the post should be using h2 \~ h6.

This rule is not mandatory, but highly recommended for visual, accessibility and SEO purposes.

## Bonus

### Image compression

When you put images in the blog post, it is recommended that the image is compressed. This will affect the overall performance of the website.

My recommendation for image compression sites.

- [TinyPng](https://tinypng.com/)
- [TinyJPG](https://tinyjpg.com/)

### OG Image

The default OG image will be placed if a post does not specify the OG image. Though not required, OG image related to the post should be specify in the frontmatter. The recommended size for OG image is **_1200 X 640_** px.

> Since AstroPaper v1.4.0, OG images will be generated automatically if not specified. Check out [the announcement](https://astro-paper.pages.dev/posts/dynamic-og-image-generation-in-astropaper-blog-posts/).
