---
"partykit": patch
---

s/unstable_onValidate/onBeforeConnect

This changes the behaviour of unstable_onValidate. Instead of return a boolean, this function now expects an error to be thrown if it's an invalid connection. Further, you can now return a json-serialisable object that gets passed on to onConnect (currently inside room.connections.<id>.unstable_initial, but we'll expose it on the connection soon.). This is particularly cool because onBeforeConnect will usually be run on a different machine from onConnect, but you'll still be able to pass data like session info etc on to onConnect.

misc: remove `serve`, fix builds.
