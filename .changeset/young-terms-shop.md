---
"partykit": patch
---

mark `clipboardy` as an external dependency

clipboardy comes with fallback binaries to use (esp. in windows). If we bundle it into the partykit bundle, then the references to those binaries fail. So we mark it as an external so it installs separately and resolves the binaries correctly.
