---
"partykit": patch
---

deploy --with-vars, and fixes for env commands

- running `deploy --with-vars` now reads values from config files
- `env pull` now writes to `partykit.json`
- env commands don't fail if a `main` isn't specified
