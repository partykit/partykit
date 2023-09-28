---
"create-partykit": patch
"partykit": patch
---

fix (internal): fix infinite loop when developing

We use node's watch mode when developing partykit itself. On node 20, this just goes into an infinite loop, because it restarts on any writes, even if the file hasn't changed (iiuc). We are compiling facade/source.ts to facade/generated.js, while also watching the facade folder, which was triggering the restarts. I moved the outout to dist/generated.js, which fixes the problem.
