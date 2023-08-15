---
"partysocket": patch
"y-partykit": patch
"partykit": patch
---

small tweaks to `init`

- replace `process.env.PARTYKIT_HOST` with just `PARTYKIT_HOST`
- add a `tsconfig.json`
- add partykit to devDependencies in `init`
- strip protocol from host (partysocket, y-partykit)
