---
"partykit": patch
---

pass sub path/init during subparty .fetch()/.socket()

This lets you pass a "sub" path to a sub party `.fetch()` or `.socket()` (and adds being able to pass a RequestInit to `.socket()`). This make it possible to do routing more cleanly inside sub parties, making them more versatile.
