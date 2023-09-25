---
"partykit": patch
---

[fix] filePath in windows

Fixes #328

In Windows devices, the assetsMap was generating file paths with double backslashes, resulting in incorrect file paths. This PR addresses this issue by replacing the double backslashes with single forward slashes, ensuring that the file paths are correct and functional.
