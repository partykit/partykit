---
title: Deploy your poll app
sidebar:
  label: 7. Deploy your poll app
description: PartyKit hosts the real-time server but you can host your website at any deployment platform of your choosing
---

PartyKit hosts the real-time server but you can host your website at any deployment platform of your choosing.

While you don't need separate repositories for the client and the PartyKit server, you will need to deploy them separately.

## Deploy PartyKit server

To deploy your PartyKit server run the following command in your project directory:

```bash
npx partykit deploy
```

When the deployment completes, you will get your app's PartyKit URL. You will need this URL when deploying your Next.js app. The URL will follow the pattern of `[your project's name].[your GitHub username].partykit.dev`.

To read more about deploying PartyKit apps, check <a href="/guides/deploying-your-partykit-server/" target="_blank" rel="noopener noreferrer">our guide</a>.

## Deploy the Next.js app

You will most probably deploy this specific Next.js app to Vercel, in which case you can follow <a href="https://nextjs.org/learn/basics/deploying-nextjs-app/deploy" target="_blank" rel="noopener noreferrer">the Vercel deployment guide</a>.

Please remember to also set the environment variables mentioned (such as `NEXT_PUBLIC_PARTYKIT_HOST` with the URL generated when deploying the PartyKit server in the previous step). To do so, you can follow <a href="https://nextjs.org/docs/app/building-your-application/configuring/environment-variables" target="_blank" rel="noopener noreferrer">the Vercel guide on secrets management</a>.

In the example repository, we've included an `.env.example` file that contains the environment variables you need to set.

## Next steps

Congratulations! You've finished the tutorial and built your first PartyKit app 🥳

You may have noticed that your users can vote multiple times. To keep this tutorial short, we have omitted integrating **authentication**. However, we have prepared a reference for you in <a href="https://github.com/partykit/partypoll/pull/1" target="_blank" rel="noopener noreferrer">this GitHub pull request</a>.

⭐️ You can also explore PartyKit by:

- browsing <a href="/examples/" target="_blank" rel="noopener noreferrer">examples</a> built by our community
- reading our <a href="/reference/" target="_blank" rel="noopener noreferrer">API reference</a>
- sharing your thoughts, ideas, projects, and feedback <a href="https://discord.gg/KDZb7J4uxJ" target="_blank" rel="noopener noreferrer">on Discord</a>

Thank you for coming along on this journey with us 🥰
