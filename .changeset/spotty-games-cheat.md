---
"partykit": patch
---

feat: configuration file / flags

This adds a configuration file for partykit projects. It looks for partykit.json by default, but you can pass -c / --config to a custom path if you'd like. Fields:
name: corresponds to project name
main: corresponds to path to script
port: local dev port number
vars: a bag of key values, where values can be any serialisable object. this can be overriden by .env files, or --var X=A flags
define: a bag of key values, where values can be strings representing js expressions.

This PR also refactors the user login/config logic, but shouldn't have broken anything.

This also adds a `env push` command to upload a bunch of env vars at one, collecting values partykit.json and .env
