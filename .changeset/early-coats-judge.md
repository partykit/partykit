---
"partykit": patch
---

feat: `tail` for live logs

running `partykit tail --name <project>` will now hook into a project's production logs and stream them live. This is a full clone of `wrangler tail`. Two notes:

- there's a bug with cf where logs on websocket connections don't come through until the websocket disconnects
- the filter aren't tested yet

That said, this is a good start, so let's land it and see what to fix after.
