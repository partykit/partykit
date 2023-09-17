---
"partysocket": patch
---

expose `partySocket.name`, and a static `.url`

This exposes the top level party 'name' on partysocket. Since urls for partysocket are 'static' we can also override the base implementation and expose the calculated url as well.
