---
title: How to connect AstroPaper blog with Forestry CMS
author: Sat Naing
pubDatetime: 2022-09-21T05:17:19Z
postSlug: how-to-connect-astro-paper-blog-with-forestry-cms
featured: false
draft: false
tags:
  - docs
  - forestry-cms
  - astro-paper
ogImage: https://res.cloudinary.com/noezectz/v1663745737/astro-paper/astropaper-x-forestry-og_kqfwp0.png
description:
  Step by step process of connecting Astro-Paper blog theme with Forestry
  Headless CMS.
---

> Important!!! Forestry is going to be discontinued on April 22nd, 2023. You can [read their announcement](https://forestry.io/blog/forestry.io-end-of-life/) for more info.

In this article, I will explain step by step process of connecting AstroPaper theme with the Forestry headless CMS. So, let's get started 🎉

## Table of contents

## What is Forestry?

[Forestry](https://forestry.io/ "Forestry Website") is a git-based headless CMS and we can manage our markdown contents easily by using that. Although it is not an open-sourced CMS, it has a good free plan by which we can import up to 3 sites (3 repositories). In this article, I'll demonstrate how we can use Forestry as git-based CMS of our AstroPaper blog theme.

## Login / Register an account at Forestry.io

First of all, you have to create an account at [Forestry website](https://app.forestry.io/login "Forestry Login Page"). I usually sign up with my Github account.

![Forestry Login page](https://res.cloudinary.com/noezectz/v1663739096/astro-paper/Forestry-io_hk5yzv.png)

## Import AstroPaper site (repository)

This part is importing the repository to Forestry and a little bit of set up process.

### Add Site

After logging in/signing up an account, import your AstroPaper site by clicking "Add Site" button.

![Forestry 'My sites' page](https://res.cloudinary.com/noezectz/v1663739752/astro-paper/Forestry-io_1_z1bdyd.png)

### Select SSG

In this case, just choose "Others"

![Selecting 'Others' as a site generator](https://res.cloudinary.com/noezectz/v1663740872/astro-paper/Forestry-io_2_blrrw2.png)

### Select Git Provider

My git provider is Github and I assume yours is the same. So, choose "Github".

![Selecting Github as a git provider](https://res.cloudinary.com/noezectz/v1663740922/astro-paper/Forestry-io_3_pj1v8v.png)

After this, the process of importing site (repo) is done.

## Set up Sidebar

The next phase after importing site is setting up sidebar menu. You can add many sidebar menu as you want. However, I'll only add one sidebar menu in this case.

Navigate to "Finish setup process" > "Set up sidebar" and click "Configure sitebar"

![Forestry welcome screen](https://res.cloudinary.com/noezectz/v1663740974/astro-paper/forestry-io_4_j35uk9.png)

Then, click "Add Section" button.

![Clicking 'Add Section' for sidebar](https://res.cloudinary.com/noezectz/v1663741011/astro-paper/forestry-io_5_sxtgvx.png)

After that, choose DIRECTORY for the Section Type.

![Choosing 'DIRECTORY' as the Selection Type](https://res.cloudinary.com/noezectz/v1663741052/astro-paper/forestry-io_6_lddmkx.png)

Then, configure the directory section. You can follow along with my setup.

![Configuring the Directory Section](https://res.cloudinary.com/noezectz/v1663741105/astro-paper/forestry-io_7_jkwgi1.png)

After this step, you should see a sidebar menu "Blog Posts" and some blog posts.

## Set up Media Import

In Forestry CMS, you can set up different options for media (aka assets) such as Cloudinary, git commit media etc. I usually store my assets in [Cloudinary](https://cloudinary.com/). To set up media import, go to Settings > Media. Then select your image storage provider. (I chose Cloudinary).

![Setting up 'Cloudinary' as the media import](https://res.cloudinary.com/noezectz/v1663741636/astro-paper/forestry-io-media-import_1_f8i4lm.png)

You can see details of Forestry Cloudinary setup at [Forestry documentation](https://forestry.io/docs/media/cloudinary/).

## Set up Front matter template

After setting everything up, you can set up front matter template for your future blog post. To set up front matter template, navigate to "Front matter" menu on the sidebar.

Then, click "Add Template" button at the top right corner.

![Front Matter Templates page](https://res.cloudinary.com/noezectz/v1663742060/astro-paper/forestry-io-frontmatter_yskfvn.png)

Select new template based on existing document.

![Creating new template based on existing document](https://res.cloudinary.com/noezectz/v1663742179/astro-paper/forestry-io-existing-doc_bwcb9q.png)

Then, add template name and choose one of my document page as template.

As the final setup, make some adjustment in the front matter field settings.

![Making some adjustment in a front matter field setting](https://res.cloudinary.com/noezectz/v1663742450/astro-paper/forestry-io-fm-config_jqmgwz.png)

Here are some adjustments you have to make.

**_title_**

- Validation => REQUIRED => true

**_author_**

- Default => your name

**_datetime_**

- Default => USE "NOW" AS DEFAULT

**_description_**

- Validation => REQUIRED => true

## Conclusion

You can now post your articles and write whatever you want.
