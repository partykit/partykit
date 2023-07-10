---
"partykit": patch
---

feat: optional hibernation api

This introduces cloudflare's new hibernation api for durable objects. (see https://developers.cloudflare.com/workers/runtime-apis/durable-objects/#hahahugoshortcode-s2-hbhb)
It kicks in when you specify `onMessage(){}` in the export. This should let us scale to thousands of connections on a single object, while also not charging for idle objects. Very nice.
