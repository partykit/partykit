---
"create-partykit": patch
"partykit": patch
---

partykit: bundle dependencies

This brings back packaging of dependencies for partykit (and introduces it for create-partykit). We had previously disabled it for deps because of esm/cjs nonsense, but we've now figured out how to make them play decently together.

I had to fork ink-testing-library because of https://github.com/vadimdemedes/ink-testing-library/pull/23, I'll remove it once that PR is merged.

This also updates ink to 4.4.1, which fixes our previous issue where it was exiting early.
