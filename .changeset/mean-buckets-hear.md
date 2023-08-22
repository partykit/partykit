---
"create-partykit": patch
---

create: always make a package.json

we were trying got be clever and not make a package.json if there was a parent (that's wasn't a monorepo root). Turns out folks have package.json's all the time. So this just always makes a package.json, and only runs the installer in the root package,json dir f it's a monorepo/has workspaces
