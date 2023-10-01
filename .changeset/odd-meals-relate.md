---
"y-partykit": patch
---

y-partykit: unstable_onRequest

This adds an `unstable_onRequest` to `y-partykit`. Folks want to use http requests to prerender documents (during SSR, for example), and/or persist with an HTTP request.

This is probably temporary while we rethink y-partykit all together.

Usage:

```ts
import { onRequest } from "y-partykit";
export default {
  onRequest(req, room) {
    return onRequest(req, room, {
      /* options */
    });
  },
};
```
