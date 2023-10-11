---
"y-partykit": patch
---

## Improved `y-partykit` persistence

This release includes bugfixes and new options to `y-partykit` server persistence layer.

### Background

By default, PartyKit maintains a copy of the Yjs document as long as at least one client is connected to the server. When all clients disconnect, the document state may be lost. 

To persists the Yjs document state between sessions, you can use the built-in PartyKit storage by enabling the `persist` option. 

This release fixes known performance and scaling issues with the existing `persist: true` option, and deprecates it in favour of two separate persistence strategies: **snapshot**, and **history**.

####  Persisting snapshots (recommended)

In `snapshot` mode, PartyKit stores the latest document state between sessions. 

```ts
onConnect(connection, party, {
  persist: { 
    mode: "snapshot" 
  }
})
```

During a session, PartyKit accumulates individual updates and stores them as separate records. When an editing session ends due to last connection disconnecting, PartyKit merges all updates to a single snapshot.

The `snapshot` mode is optimal for most applications that do not need to support long-lived offline editing sessions.

#### Persisting update history (advanced)

In `history` mode, PartyKit stores the full edit history of the document.

This is useful when multiple clients are expected to be able to change the document while offline, and synchronise their changes later.

```ts
onConnect(connection, party, {
  persist: { 
    mode: "history",
  }
})
```

For long-lived documents, the edit history could grow indefinitely, eventually reaching the practical limits of a single PartyKit server instance. To prevent unbounded growth, PartyKit applies a 10MB maximum limit to the edit history. 

You can customise these limits as follows:

```ts
onConnect(connection, party, {
  persist: { 
    mode: "history",
    // Maximum size in bytes. 
    // You can set this value to any number below 10MB (10_000_000 bytes).
    maxBytes: 10_000_000,

    // Maximum number of updates. 
    // By default, there is no maximum, and history grows until maximum amount of bytes is reached.
    maxUpdates: 10_000,
  }
})
```

Once either limit is reached, the document is snapshotted, and history tracking is started again.

#### Deprecating `persist: true`

In previous versions, PartyKit only had one persistence mode:

```ts
onConnect(connection, party, { persist: true })
```

In this mode, PartyKit would store the full edit history of the Yjs document in the party storage. This worked well for short-lived documents, but would break for long-lived documents, as the document history size would grow until it would reach the practical limits of the runtime environment.

From this version onwards, `persist: true` will function identically to setting `persist: { mode: "history" }`, including respecting the maximum storage limits.

This option is still supported for backwards compatibility reasons, but will be removed in a future version of `y-partykit`. 


