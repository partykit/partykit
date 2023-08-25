---
"partykit": patch
---

fix: timing issues with assets/build server

In `dev` we have some issues with the way we initialise/restart servers

- if an external process is generating assets, and it does it quickly, then we end up crashing the assets server
- we were restarting the assets folder watcher whenever the assets watcher restarted
- we weren't cleaning up the assets folder watcher on effect rerun
- we weren't cleaning up the custom build folder watcher on effect rerun

So, the fixes:

- debounce setting the assets map (100ms, is short enough to not be noticeable, but long enough to let esbuild manager a restart)
- close the assets build watcher correctly
- don't restart the assets build watcher incessantly
- close the custom build watcher correctly
