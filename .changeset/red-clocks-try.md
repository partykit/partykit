---
"y-partykit": patch
---

y-partykit: remove document size limits

By chunking values, we can workaround DO's 128 kb value size limit. This patch implements that, and adds a couple of tests too.
