---
"y-partykit": patch
---

fix: properly sort chunking in y-partykit for big values

So, out persistence layer has a 128kb limit on values, but `y-partykit` should/could be used for documents bigger than that. So we implemented a chunking strategy that break up values across multiple keys. When making keys for these, we didn't pad the generated indexes, which meant that for sufficiently large values, we might have assembled them back in the wrong order (because lexicographical sorting). This is a fix for that. It's a breaking change, but oddly I haven't heard from people who've faced the problem at all.
