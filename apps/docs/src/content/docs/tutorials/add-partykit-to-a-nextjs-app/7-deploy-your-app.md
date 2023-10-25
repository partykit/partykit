---
title: Deploy your poll app
sidebar:
    label: 7. Deploy your poll app
description: PartyKit hosts the real-time server but you can host your website at any deployment platform of your choosing
---

PartyKit hosts the real-time server but you can host your website at any deployment platform of your choosing.

While you don't need separate repositories for the client and the PartyKit server, you will need to deploy them separately.

## Deploy Next.js app

In the case of this specific Next.js app, you will most probably deploy it to Vercel, in which case you can follow [the Vercel deployment guide](https://nextjs.org/learn/basics/deploying-nextjs-app/deploy).

Please remember to also set the environment variables mentioned (such as `PARTYKIT_URL`). To do so, you can follow [the Vercel guide on secrets management](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables).

## Deploy PartyKit server

Next, deploy your PartyKit server with a one-line command following [our deployment guide](/guides/deploy-your-partykit-server).

## Next steps

Congratulations! You've finished the tutorial and built your first PartyKit app.

Explore PartyKit by:

- consulting our [API reference](/reference/)
- browsing [examples](/examples/) built by our community
- sharing your thoughts, ideas, projects, and feedback [on Discord](https://discord.gg/KDZb7J4uxJ)
