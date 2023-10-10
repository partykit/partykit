---
"partykit": patch
---

await multiparties.socket()

This introduces a new method `.socket()` to the multiparties bag. Much like the .fetch() method() on the bag, this now uses an internal api to connect with a websocket to the party, instead of using a URL and connecting via the internet. Importantly, this also works from inside onFetch() handlers. This patch also deprecates the previous `.connect()` method.
