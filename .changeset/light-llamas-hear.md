---
"partykit": patch
---

feat: persistence / storage (phase 1)

This implements persistence / storage for partykit. It hijack's cloudflare's DO storage api (without config options). This doesn't implement DO's i/o gates yet, but that's kinda fine, because it means you have to write code that's good in dev (but production will automatically be better). We'll implement them later. Also this currently does in-memory storage. We'll fix that in the future by (optionally) using disk for persistence.
