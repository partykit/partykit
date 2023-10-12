---
"y-partykit": patch
---

y-partykit: Implement WebSocket chunking for y-partykit/provider

Workers platform limits individual WebSocket message size to 1MB. There are legitimate situations when YPartyKitProvider sync messages can exceed 1MB.

This is an experimental fix to batch messages into 1MB chunks.

