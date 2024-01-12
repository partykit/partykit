---
title: Preview Environments
description: Using --preview to make staging environments for your PartyKit projects
---

The PartyKit CLI lets you deploy your projects to our edge platform with `partykit deploy`. By default, this uses your user/team name and project name to generate a unique URL for your project. For example, if your user name is `alice` and your project name is `my-project`, your project will be deployed to `https://my-project.alice.partykit.dev`.

(Alternately, when deploying to your own CF account, you can pass a custom domain with `partykit deploy --domain mydomain.com`.)

A common software engineering pattern is to have multiple environments for your project. For example, you might have a `staging` environment for testing, and a `production` environment for your live users. You might want to deploy every github PR to its own environment so you can test it before merging.

To support this, PartyKit has a `--preview` flag that lets you deploy to a custom URL. Taking the original example, if you run `partykit deploy --preview my-preview`, your project will be deployed to `https://my-preview.my-project.alice.partykit.dev`. When you're done testing your preview environment, you can then delete it with `partykit delete --preview my-preview`.

(When deploying to your own CF account, you can pass a custom domain with `partykit deploy --domain mydomain.com --preview my-preview`, and your project will be deployed to `https://my-preview.mydomain.com`.)

It's that simple! In the future, we may provide a custom github action that automates this behaviour for you on every PR, but you can get started today by setting up these commands in your CI/CD pipeline.
