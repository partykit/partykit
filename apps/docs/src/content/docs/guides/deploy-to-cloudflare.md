---
title: Deploy to your own Cloudflare account
description: Deploy to your own Cloudflare account
---

The PartyKit platform is powered by Cloudflare Workers, a worldwide network of servers that run projects with low latency and high performance.

By default we manage the platform for your projects.

## Managed vs Cloud-Prem

As a managed platform, PartyKit abstracts away the complexity of deploying to the cloud and allows you to focus on building. We handle ops and provisioning resources like static assets, Durable Objects, configuring routes and more. Our platform also scales with you.

In some advanced scenarios, you may want to move away from the managed platform and deploy your projects to your own Cloudflare account instead:

- You have regulatory requirements that require you to use your own Cloudflare account
- You want to use a domain already configured under Cloudflare
- You'd like to use your existing Cloudflare Workers and services in tandem with PartyKit

PartyKit supports this configuration, called **cloud-prem.**

You can start with the default, managed platform and switch to cloud-prem at any point.

## How to deploy

Running this command will deploy your project to your own Cloudflare account:

```bash
CLOUDFLARE_ACCOUNT_ID=<your account id> CLOUDFLARE_API_TOKEN=<your api token> npx partykit deploy --domain partykit.domain.com
```

You can find your account ID in the overview page of your domain. For more information, see [Cloudflare's documentation](https://developers.cloudflare.com/fundamentals/setup/find-account-and-zone-ids)

You can make an API token https://dash.cloudflare.com/profile/api-tokens with the `Edit Cloudflare Workers` template.

:::tip
(You can also set `domain` under `partykit.json`)
:::

:::tip
You can also set the `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` environment variables in your shell.
:::

#### Pricing

The PartyKit platform fee is free for cloud-prem deployments.

## Future development

This is our initial implementation and we're planning features based on demand. For example future versions of cloud-prem could:

- Add bindings to Cloudflare services that PartyKit doesn't support yet (like KV, R2, D1, logpush)
- Integrate PartyKit's login with Cloudflare Access/Logins
- Run PartyKit inside a [wrangler](https://developers.cloudflare.com/workers/wrangler/) project

We'd love to hear feedback and feature requests on our [Discord](https://discord.gg/GJwKKTcQ7W), let us know!
