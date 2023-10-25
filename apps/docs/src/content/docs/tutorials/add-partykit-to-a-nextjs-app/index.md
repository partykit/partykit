---
title: What you will build
sidebar:
    label: 1. What you will build
description: In this tutorial, you'll add a real-time feature to a Next.js app
---

In this tutorial, you'll add a real-time feature to a Next.js app. To get a feel of the app, you can play with the [live demo](https://partypoll.vercel.app/).

Here's the poll app with two pages. The first page lets you create a poll.

![A screenshot of the form for generating the poll](../../../../assets/tutorials/add-partykit-to-a-nextjs-app/page1-1.png)

And the second page features the created poll that you can share with your  friends.

![A screenshot of the page featuring the poll with the question: "Are pierogi an empanada?"](../../../../assets/tutorials/add-partykit-to-a-nextjs-app/page1-2.png)

## How does real-time work here?

When the user submits the form, two things will happen.

First, an HTTP request will be made to PartyKit to create a new PartyKit room, which will be used by the newly created poll.

Secondly, the form will redirect to the poll page, and a new WebSocket connection will start to the PartyKit room.

As soon as the poll is created, its link is shareable. When new users visit the page, they will also establish a WebSocket connection and their votes will broadcast in real time to others.

## Get started

To get started, clone the [the barebone app code](https://github.com/partykit/partypoll) and follow these steps:

1. Run `npm install` inside the project repository
2. Run `npm run dev`
3. Open `http://localhost:3000/` in your browser
4. Whenever you change and save the files, the page will automatically reload

## Next steps

You're now ready to begin your adventure with PartyKit. You will first [set up the PartyKit server](./2-set-up-server).

:::tip[Finished code]
We've also prepared [the finished code]() in a separate folder so whenever you're curious about the finished code.
:::
