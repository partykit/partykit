---
"partykit": patch
---

feat: custom bindings for cloud-prem (part 1)

Instead of having to provision resources directly from the config, we'd like to bind to existing resources in users' CF accounts. For example, you have an R2 bucket that you'd like to access from your partykit project. Now, you can add this to your `partykit.json`:

```jsonc
{
  //...
  "bindings": {
    "r2": {
      "myBucket": "my-bucket-name"
    }
  }
}
```

Inside your project, you can now access the r2 bucket with `room.context.bindings.r2.myBucket` (or `lobby.bindings.r2.myBucket`).

We'll add more types of bindings in the near future.
