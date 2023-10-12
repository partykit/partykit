---
"partysocket": patch
---

don't mark react as a dependency for partysocket

This dependency causes way too many issues, especially since react doesn't work with multiple versions. Let's see if removing it helps.
