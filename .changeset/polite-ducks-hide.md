---
"partykit": patch
---

Add new `connection.state` and `connection.getState` methods.

```ts
import type * as Party from "partykit/server";

// optional: you can provide typescript types for state for additional type safety
type Connection = Party.Connection<{ country: string }>;

class PartyServer {
  onConnect(connection: Connection, { request }) {
    // you can .setState to store information on connection
    connection.setState({ country: request.cf.country });
  }
  onMessage(message: string, connection: Connection) {
    // you can access .state to get information stored with .setState
    console.log(`${message} from user in ${connection.state?.country}`);
  }
}
```
