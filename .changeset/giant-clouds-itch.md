---
"partykit": patch
---

feat: persist state locally in dev

Currently, `.storage` is only held in memory. This is fine for most usecases, but it means if you shutdown the dev process, we lose any state you may have been holding. This PR adds a config/flag `persist` to store this locally. We also turn it on by default. You can pass `--persist false` in the cli, or `persist: false` in config to turn it off (or `true` for default path). You can also pass `--persist some/custom/path` in the cli, or `persist: "some/custom/path" in the config, to use a custom path for the state.

Fixes https://github.com/partykit/partykit/issues/161
