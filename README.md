## partykit

Everything's better with friends.

`partykit` is a software development kit for building "multiplayer" collaborative applications. You can use it with your existing web applications, or build new ones from scratch.

### server

```ts
// server.ts
export default {
  connect(room, connection) {
    // called whenever a user join a room
  },
  disconnect(room, connection) {
    // called whenever a user leaves a room
  },
};
```

client

server

templates
