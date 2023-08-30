---
"partykit": patch
---

fix: call oBC/oBR on sub parties

We hadn't wired up onBeforeConnect/onBeforeRequest for multi parties. To fix this, I did a refactor where _every_ request goes through a common codepath now. Additionally, this also means that `/parties/main/:id` is equivalent to `party/:id`. I also massaged out some differences between the platform/cli facade.
