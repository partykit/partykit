---
author: Sat Naing
pubDatetime: 2022-12-28T04:59:04.866Z
title: Dynamic OG image generation in AstroPaper blog posts
postSlug: dynamic-og-image-generation-in-astropaper-blog-posts
featured: false
draft: false
tags:
  - docs
  - release
ogImage: ""
description: New feature in AstroPaper v1.4.0, introducing dynamic OG image generation for blog posts.
---

New feature in AstroPaper v1.4.0, introducing dynamic OG image generation for blog posts.

## Table of contents

## Intro

OG images (aka Social Images) play an important role in social media engagements. In case you don't know what OG image means, it is an image displayed whenever we share our website URL on social media such as Facebook, Discord etc.

> The Social Image used for Twitter is technically not called OG image. However, in this post, I'll be using the term OG image for all types of Social Images.

## Default/Static OG image (the old way)

AstroPaper already provided a way to add an OG image to a blog post. The author can specify the OG image in the frontmatter `ogImage`. Even when the author doesn't define the OG image in the frontmatter, the default OG image will be used as a fallback (in this case `public/astropaper-og.jpg`). But the problem is that the default OG image is static, which means every blog post that does not include an OG image in the frontmatter will always use the same default OG image despite each post title/content being different from others.

## Dynamic OG Image

Generating a dynamic OG image for each post allows the author to avoid specifying an OG image for every single blog post. Besides, this will prevent the fallback OG image from being identical to all blog posts.

In AstroPaper v1.4.0, Vercel's [Satori](https://github.com/vercel/satori) package is used for dynamic OG image generation.

Dynamic OG images will be generated at build time for blog posts that

- don't include OG image in the frontmatter
- are not marked as draft.

## Anatomy of AstroPaper dynamic OG image

Dynamic OG image of AstroPaper includes _the blog post title_, _author name_ and _site title_. Author name and site title will be retrieved via `SITE.author` and `SITE.title` of **"src/config.ts"** file. The title is generated from the blog post frontmatter `title`.  
![Example Dynamic OG Image link](https://user-images.githubusercontent.com/53733092/209704501-e9c2236a-3f4d-4c67-bab3-025aebd63382.png)

## Limitations

At the time of writing this, [Satori](https://github.com/vercel/satori) is fairly new and has not reached major release yet. So, there are still some limitations to this dynamic OG image feature.

- If you have Blog posts with non-English titles, you have to set `embedFonts` option to `false` (file: `src/utils/generateOgImage.tsx`). Even after this, the OG image might not be displayed very well.
- Besides, RTL languages are not supported yet.
- [Using emoji](https://github.com/vercel/satori#emojis) in the title might be a little bit tricky.
- Sadly, this new dynamic OG image generation feature cannot be used for Twitter social images since `svg` image type is not supported for Twitter Cards.
