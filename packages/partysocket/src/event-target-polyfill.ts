import { Event, EventTarget } from "event-target-shim";

if (!globalThis.Event) {
  // @ts-expect-error we're polyfilling it
  globalThis.Event = Event;
}
if (!globalThis.EventTarget) {
  // @ts-expect-error we're polyfilling it
  globalThis.EventTarget = EventTarget;
}
