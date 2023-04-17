---
"partykit": patch
---

fix: don't validate user tokens

This comments out `validateUserConfig`. We already had a bug where we weren't using it, but it's actually not that useful since we validate on the server anyway. So this patch comments out the implementation and usage.
