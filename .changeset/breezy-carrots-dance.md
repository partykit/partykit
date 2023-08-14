---
"partykit": patch
---

feat: define a default `process.env.PARTYKIT_HOST`

We can actually make a pretty good guess to what the host is for both dev and deploy, so let's define it when compiling, and remove a bunch of boilerplate in the process.
