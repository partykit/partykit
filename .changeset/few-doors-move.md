---
"partykit": patch
---

dev: add a flag `--disable-request-cf-fetch`

when miniflare starts, it makes a request to get data to populate request.cf. This might not be desirable in some secure environments. This PR adds a flag to disable that behaviour.
