---
"create-partykit": patch
"partykit": patch
---

create: don't initialise git repo inside another

When we create a project, we shouldn't try to create a git repo if we're initialising inside another git repo (like a monorepo). This PR detects whether there's a git folder and skips the git repo creation part.

Additionally:

- we switch away from `find-config` to `find-up` everywhere, since it works on both files and directories
- I also took the opportunity to enable `verbatimModuleSyntax` in our tsconfig, which makes vscode import types correctly when we auto-import
