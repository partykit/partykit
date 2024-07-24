---
"partysocket": patch
"y-partykit": patch
---

'prefix' option for PartySocket/YPartyKitProvider

We currently assume that parties are routed to by /parties/:party/:room (or /party/:room for the default party.) However, there will be upcoming changes where parties can be routed to on the basis of any url (or even any other param, like a session id or whatever). This change lets clients connect with a `prefix` param. It also uses /parties/main/:room when connecting to the default party. This is not a breaking change, all projects should still just work as expected.
