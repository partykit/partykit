---
"y-partykit": patch
---

y-partykit: remove ping-pong

We had a ping-pong loop with partykit to keep the object alive, but it's not necessary. This patch removes it.
