---
"partysocket": patch
---

partysocket fix: don't crash in codesandbox

looks like tools like stackblitz defines `process` on the fronted (???), but when we test for process.versions.node it crashes. This fixes the detection logic.

(PartyKit doesn't work in stackblitz yet, but atleast this error shouldn't happen)
