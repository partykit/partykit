---
"partykit": patch
---

Fix bad URL on windows, from `path.join( import.meta.url, "../dist/generated.js" )`
which produces url startring with `.\\file:\\`, that incorrectly has `.\\`.

Changes to `partykit/src/dev.tsx` and `partykit/src/cli.tsx`