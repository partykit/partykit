---
title: Deploy to your own Cloudflare account
description: Deploy to your own Cloudflare account
---

The PartyKit platform is powered by Cloudflare Workers, a worldwide network of thousands of servers that run projects with incredibly low latency and high performance. It abstracts away the complexity of deploying to the cloud, and allows you to focus on building your project. As a fully managed platform, PartyKit handles all the ops for you, and you can manage all your projects from a single point. PartyKit handles provisioning resources like static assets Durable Objects, configuring routes, and more. It also scales with you, so you don't have to worry about your project going viral.

However, you may want to deploy your projects to your own Cloudflare account for a number of reasons:

- You have regulatory requirements that require you to use your own Cloudflare account
- You want to use a domain already configured under Cloudflare
- You'd like to use your existing Cloudflare Workers and services in tandem with PartyKit

In the advanced scenario, PartyKit makes it extremely easy to deploy to your own Cloudflare account. You can always start with the default, managed platform and switch to cloud-prem at any point.

tl;dr:

```bash
CLOUDFLARE_ACCOUNT_ID=<your account id> CLOUDFLARE_API_TOKEN=<your api token> npx partykit deploy --domain partykit.domain.com
```

Running this command will deploy your project to your own Cloudflare account. You won't have to pay for usage of the PartyKit platform, but you will be billed for usage of Cloudflare Workers and other services by Cloudflare itself.

:::tip
(You can also set `domain` under `partykit.json`)
:::

:::tip
You can make an API token https://dash.cloudflare.com/profile/api-tokens with the `Edit Cloudflare Workers` template.
:::

:::tip
You can also set the `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` environment variables in your shell.
:::

This is our initial implementation, but we'd like to add more features in the future, like:

- Add bindings to Cloudflare services that PartyKit doesn't support yet (like KV, R2, D1, logpush)
- Integrate PartyKit's login with Cloudflare Access/Logins
- Run PartyKit inside a [wrangler](https://developers.cloudflare.com/workers/wrangler/) project

We'd love to hear feedback and feature requests on our [Discord](https://discord.gg/GJwKKTcQ7W), let us know!
