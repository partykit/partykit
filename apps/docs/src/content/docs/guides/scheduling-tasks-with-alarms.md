---
title: Scheduling tasks with Alarms
description: Perform recurring tasks, scheduled jobs, or clean up unused rooms
---

PartyKit allows you to schedule an alarm some time in the future, and will wake up your room at the scheduled time. This is especially helpful for tasks like:

- Recurring tasks (cron jobs)
- Cleaning up unused storage

## Setting an alarm

You can schedule an alarm by calling `Party.storage.setAlarm`.

For example, the following methods sets an alarm 5 minutes from now:

```ts
this.room.storage.setAlarm(Date.now() + 5 * 60 * 1000);
```

## Reacting to alarms

When the alarm "rings", PartyKit will call the [`onAlarm`](/reference/partyserver-api#partyserveronalarm) callback in your Party server.

```ts
onAlarm() {
  // do something
  this.refreshDataFromExternalDatabase();

  // (optional) schedule next alarm in 5 minutes
  this.room.storage.setAlarm(Date.now() + 5 * 60 * 1000);
}
```

## Waking up rooms

If the room is currently "awake" (meaning that someone is connected to it, or, in [Hibernation mode](./scaling-partykit-servers-with-hibernation/), it has recently processed messages), the `onAlarm` callback is executed in the current room process.

If the room is currently "asleep" (it's not actively handling connections or messages), the PartyKit runtime will load the room into memory, as if it just received a connection or a message. This means that PartyKit will first run the room's constructor and the `onStart` method, and only then call `onAlarm`.

## Limitations

### One active alarm per room

Each PartyKit room can have only one active alarm at a time. If you call `setAlarm` while another alarm is already active, the previous alarm will be canceled in favor of the new one.

You can use `Party.storage.getAlarm` to check if an alarm is already set. In this example, we only set the new alarm if it is happening sooner than the alarm which was set previously:

```ts
const nextAlarm = Date.now() + 1000 * 60 * 5;
const previousAlarm = await this.room.storage.getAlarm();
if (previousAlarm === null || nextAlarm < previousAlarm) {
  await this.room.storage.setAlarm(nextAlarm);
}
```

If you need multiple concurrent alarms, you can implement this yourself by storing the alarm times in [room storage](./persisting-state-into-storage/), and when the first alarm goes off, scheduling the next soonest alarm in the `onAlarm` callback.

### Accessing `Party.id`

Because we cannot expect the room to be currently holding connections when the alarm rings, we aren't currently able to automatically deduce the room's `id`. Because of that, the following will throw an error:

```ts
onAlarm() {
  console.log(this.room.id);
}
```

You can work around this limitation by storing the room `id` in [room storage](./persisting-state-into-storage/), and reading it from there:

```ts
onStart() {
  if (this.room.id) {
    // save id when room starts from a connection or request
    await this.room.storage.put<string>("id", this.id);
  }
}

onAlarm() {
  // read id from storage
  const id = await this.room.storage.get<string>("id");
  console.log(id);
}
```

This is a temporary limitation, and will be lifted in a future version of PartyKit.

### Accessing other parties

Normally, you can communicate between different parties and rooms inside the PartyKit runtime as follows:

```ts
onConnect() {
  const otherParty = this.room.context.parties.otherPartyName.get(otherRoomId);
  const req = await otherParty.fetch("/path", { method: "POST" });
}
```

However, `Party.context.parties` is not available inside `onAlarm`, so the above code snippet would throw and error.

As a workaround, you can `fetch` to the other parties using their public address:

```ts
onAlarm() {
  const url = `https://project.username.partykit.dev/parties/otherPartyName/${otherRoomId}`;
  const req = await fetch(url, { method: "POST" });
}
```

Note that using `fetch` is not fully equivalent to the `otherParty.fetch` call, as the former is routed via the Internet, and the latter happens inside PartyKit's runtime.

This is a temporary limitation, and will be lifted in a future version of PartyKit.

## Common tasks

### Expiring unused room storage

Sometimes, you may want to persist [room storage](./persisting-state-into-storage/) for a limited period, and clean it up when it is no longer being used.

A handy pattern is to keep updating an alarm every time you save data to storage. If the alarm ever rings, you know that the room has not been accessed for that time, and you can safely remove unused storage:

```ts
const EXPIRY_PERIOD_MILLISECONDS = 30 * 24 * 60 * 60 * 1000; // 30 days

export default class UserSession implements Party.Server {
  onMessage(message: string) {
    const data = JSON.parse(message);
    // do something, and save to storage
    await this.room.storage.put(data.id, data);
    await this.room.storage.setAlarm(Date.now() + EXPIRY_PERIOD_MILLISECONDS);
  }

  onAlarm() {
    // clear all storage in this room
    await this.room.storage.deleteAll();
  }
}
```

The above example deletes the data after it has not been changed for 30 days. If you wanted to keep the data around 30 days since it was last read, you can also update the same alarm for example when a user connects to the room:

```ts
  onConnect(connection: Party.Connection) {
    // do something, and save to storage
    connection.send(await this.room.storage.get(data.id));
    await this.room.storage.setAlarm(Date.now() + EXPIRY_PERIOD_MILLISECONDS);
  }
```
