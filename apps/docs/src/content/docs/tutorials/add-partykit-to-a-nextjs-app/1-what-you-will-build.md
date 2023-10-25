---
title: What you will build
sidebar:
    label: 1. What you will build
description: In this tutorial, you'll add a real-time feature to a Next.js app
---

In this tutorial, you'll add a real-time feature to a Next.js app. Here's a bare-bones poll app with two pages. You can play with the [live demo]().

The first page lets you create a poll.

<!-- image -->

And the second page features the created poll that you can share with your  friends.

<!-- image -->

## How does real-time work here?

The moment the user submits the form, two things will happen.

First, an HTTP request will be made to PartyKit to create a new PartyKit room, which will be used by the newly created poll.

Secondly, the form will redirect to the poll page, and a new WebSocket connection will start.

As soon as the poll is created, its link is shareable. When new users visit the page, they will also establish a WebSocket connection and their votes will broadcast in real time to others.

## Get started

To get started, clone the [the barebone app code]() and follow these steps:

1. Run `npm install` inside the project repository
2. Run `npm run dev`
3. Open `http://localhost:3000/` in your browser
4. Whenever you change and save the files, the page will automatically reload

You're now ready to begin your adventure with PartyKit.

:::tip[Finished code]
We've also prepared [the finished code]() in a separate folder so whenever you're curious about the finished code.
:::