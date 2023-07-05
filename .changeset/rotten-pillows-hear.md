---
"partykit": patch
---

feat: multiparty support

Not all architectures can be represented with a single 'type' of entity. The interesting ones have multiple types of entities, interconnected by business logic. For example, you could model a chat system with a chatroom entity, a user entity, and a rate limiter entity. 

This patch introduces "multiparty" support. You can define multiple modules with the same `PartyKitServer` interface in different modules, and configure them in `partykit.json`, like so: 

```json
main: "./src/main.ts" // your "main" entity, usually performing supervisory work
parties: {
  chatroom: "chatroom.ts",
  user: "user.ts",
  limiter: "rate-limiter.ts"
}
// ...
```

You can then reference these entities via `room.parties.<user/chatroom/limiter>.get('some-id')` and then make an http request to it with `.fetch(req)` or open a WebSocket to it with `.connect()`. 

This needs more examples and documentation (and potentially iterating on the api), but let's land it to experiment with the model a little. 