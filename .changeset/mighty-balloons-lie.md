---
"y-partykit": patch
---

y-partykit: export `unstable_getYDoc`

This is an escape hatch to get access to the `Y.Doc` instance, or initialize it if one doesn't exist yet.

```ts
import type * as Party from "partykit/server";
import { onConnect, unstable_getYDoc, type YPartyKitOptions } from "y-partykit";

// options must match when calling unstable_getYDoc and onConnect
const opts: YPartyKitOptions = { persist: true };

export default class YjsServer implements Party.Server {
  yjsOptions: YPartyKitOptions = { persist: true };
  constructor(public party: Party.Party) {}

  async onRequest() {
    const doc = await unstable_getYDoc(this.party, opts);
    return new Response(doc.getText("message")?.toJSON());
  }

  onConnect(conn: Party.Connection) {
    return onConnect(conn, this.party, opts);
  }
}

```

### Caveats 

This API is marked `unstable`, because it's likely to be superceded by a better API in the future.

Notably, the `options` argument provided to `unstable_getYDoc` should match the options provided to `onConnect`. We do currently not change the options when each change is made, so the first options passed are applied, and any further changes are ignored. We try to detect changed options, and show a warning if changes are detected.
