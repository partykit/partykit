---
"partykit": patch
---

partykit: adds more hibernatable socket methods

This adds the missing methods that we can use to respond to messages when objects are hibernated without waking up the object. Namely, setWebSocketAutoResponse, getWebSocketAutoResponse, and getWebSocketAutoResponseTimestamp. Details in type signature, more info here: https://developers.cloudflare.com/durable-objects/api/websockets/#setwebsocketautoresponse
