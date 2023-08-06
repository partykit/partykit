---
"partykit": patch
---

feat: serve `config.assets` / `--assets`

This PR adds support for deploying static assets.

- You can configure `config.assets` or `--assets` to point to a directory of static assets
- You can also configure `config.assets` to `{ path, browserTTL, edgeTTL, include, exclude, serveSinglePageApp }`
- In dev, it serves these assets "locally"
- It can deploy these assets to PartyKit and serve them from the edge
