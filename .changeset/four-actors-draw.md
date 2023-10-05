---
"partykit": patch
---

fix: .send and .broadcast can send ArrayBuffers

WebSocket messages can be `string | ArrayBuffer | ArrayBufferView`, this patch fixes the types to allow that. The implementation remains the same (and otherwise always worked).
