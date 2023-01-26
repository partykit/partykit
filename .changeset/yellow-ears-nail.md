---
"partysocket": patch
"y-partykit": patch
---

y-partykit (feat): `onCommand` as a server configuration option

y-partykit currently assumes all messages on the wire are yjs messages (usually all binary data), but we have usecases where we want to send arbitrary commands to the server and act on them (usually still with the context of a doc). So now y-partykit accepts a handler for all string messages that we're calling 'commands' - `onCommand(string, Y.Doc)`.

Additionally, partysocket now also exports it's base websocket class as partysocket/ws
