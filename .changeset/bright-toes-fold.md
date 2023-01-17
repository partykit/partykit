---
"y-partykit": patch
---

feat: y-partykit persistence support

This adds persistence support for y-partykit (based on the work at y-workers). It... just works haha. Pass `persist:true` to `onConnect` to store it. This still bumps into DO's 128 kb limit, but we'll fix that asap.
