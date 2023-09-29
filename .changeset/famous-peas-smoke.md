---
"partykit": patch
---

experimental: `dev --unstable_outdir <path>`

When we have errors in the code, we log the error, but it uses line numbers from the output worker, which aren't helpful. Particularly because we don't output the actual worker to disk anyway, so they can't figure out where the error is coming from. It's really bad for large codebases.

Figuring out debugging is a top level concern for us; we want to have sourcemaps, breakpoints, devtools - the works. But until we get there, we should help people find where errors are coming from.

This adds an experimental `--unstable_outdir <path>` to `partykit dev` that spits out the actual code that we run in the dev environment, so folks can inspect it. The output code also inlines filenames, so that should help as well. This should hold folks until we have a better debugging story.
