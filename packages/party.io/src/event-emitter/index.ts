/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * An events map is an interface that maps event names to their value, which represents the type of the `on` listener.
 */
export interface EventsMap {
  [event: string]: any;
}

/**
 * The default events map, used if no EventsMap is given. Using this EventsMap is equivalent to accepting all event
 * names, and any data.
 */
export interface DefaultEventsMap {
  [event: string]: (...args: any[]) => void;
}

/**
 * Returns a union type containing all the keys of an event map.
 */
export type EventNames<Map extends EventsMap> = keyof Map & (string | symbol);

/** The tuple type representing the parameters of an event listener */
export type EventParams<
  Map extends EventsMap,
  Ev extends EventNames<Map>
> = Parameters<Map[Ev]>;

/**
 * The event names that are either in ReservedEvents or in UserEvents
 */
export type ReservedOrUserEventNames<
  ReservedEventsMap extends EventsMap,
  UserEvents extends EventsMap
> = EventNames<ReservedEventsMap> | EventNames<UserEvents>;

/**
 * Type of a listener of a user event or a reserved event. If `Ev` is in `ReservedEvents`, the reserved event listener
 * is returned.
 */
export type ReservedOrUserListener<
  ReservedEvents extends EventsMap,
  UserEvents extends EventsMap,
  Ev extends ReservedOrUserEventNames<ReservedEvents, UserEvents>
> = FallbackToUntypedListener<
  Ev extends EventNames<ReservedEvents>
    ? ReservedEvents[Ev]
    : Ev extends EventNames<UserEvents>
      ? UserEvents[Ev]
      : never
>;

/**
 * Returns an untyped listener type if `T` is `never`; otherwise, returns `T`.
 *
 * Needed because of https://github.com/microsoft/TypeScript/issues/41778
 */
type FallbackToUntypedListener<T> = [T] extends [never]
  ? (...args: any[]) => void | Promise<void>
  : T;

/**
 * Strictly typed version of an `EventEmitter`. A `TypedEventEmitter` takes type parameters for mappings of event names
 * to event data types, and strictly types method calls to the `EventEmitter` according to these event maps.
 *
 * @typeParam ListenEvents - `EventsMap` of user-defined events that can be listened to with `on` or `once`
 * @typeParam EmitEvents - `EventsMap` of user-defined events that can be emitted with `emit`
 * @typeParam ReservedEvents - `EventsMap` of reserved events, that can be emitted with `emitReserved`, and can be
 * listened to with `listen`.
 */
abstract class BaseEventEmitter<
  ListenEvents extends EventsMap,
  EmitEvents extends EventsMap,
  ReservedEvents extends EventsMap = never
> {
  private _listeners: Map<
    ReservedOrUserEventNames<ReservedEvents, ListenEvents>,
    Array<ReservedOrUserListener<ReservedEvents, ListenEvents, any>>
  > = new Map();

  /**
   * Adds the `listener` function as an event listener for `ev`.
   *
   * @param event - Name of the event
   * @param listener - Callback function
   */
  public on<Ev extends ReservedOrUserEventNames<ReservedEvents, ListenEvents>>(
    event: Ev,
    listener: ReservedOrUserListener<ReservedEvents, ListenEvents, Ev>
  ): this {
    const listeners = this._listeners.get(event);
    if (listeners) {
      listeners.push(listener);
    } else {
      this._listeners.set(event, [listener]);
    }
    return this;
  }

  /**
   * Adds a one-time `listener` function as an event listener for `ev`.
   *
   * @param event - Name of the event
   * @param listener - Callback function
   */
  public once<
    Ev extends ReservedOrUserEventNames<ReservedEvents, ListenEvents>
  >(
    event: Ev,
    listener: ReservedOrUserListener<ReservedEvents, ListenEvents, Ev>
  ): this {
    // @ts-expect-error force listener type
    const onceListener: ReservedOrUserListener<
      ReservedEvents,
      ListenEvents,
      Ev
    > = (...args: any[]) => {
      this.off(event, onceListener);
      listener.apply(this, args);
    };

    // to work with .off(event, listener)
    onceListener.fn = listener;

    return this.on(event, onceListener);
  }

  /**
   * Removes the `listener` function as an event listener for `ev`.
   *
   * @param event - Name of the event
   * @param listener - Callback function
   */
  public off<Ev extends ReservedOrUserEventNames<ReservedEvents, ListenEvents>>(
    event?: Ev,
    listener?: ReservedOrUserListener<ReservedEvents, ListenEvents, Ev>
  ): this {
    if (!event) {
      this._listeners.clear();
      return this;
    }

    if (!listener) {
      this._listeners.delete(event);
      return this;
    }

    const listeners = this._listeners.get(event);

    if (!listeners) {
      return this;
    }

    for (let i = 0; i < listeners.length; i++) {
      if (listeners[i] === listener || listeners[i].fn === listener) {
        listeners.splice(i, 1);
        break;
      }
    }

    if (listeners.length === 0) {
      this._listeners.delete(event);
    }

    return this;
  }

  /**
   * Emits an event.
   *
   * @param event - Name of the event
   * @param args - Values to send to listeners of this event
   */
  public emit<Ev extends EventNames<EmitEvents>>(
    event: Ev,
    ...args: EventParams<EmitEvents, Ev>
  ): boolean {
    const listeners = this._listeners.get(event as EventNames<ListenEvents>);

    if (!listeners) {
      return false;
    }

    if (listeners.length === 1) {
      listeners[0].apply(this, args);
    } else {
      for (const listener of listeners.slice()) {
        listener.apply(this, args);
      }
    }

    return true;
  }

  /**
   * Returns the listeners listening to an event.
   *
   * @param event - Event name
   * @returns Array of listeners subscribed to `event`
   */
  public listeners<
    Ev extends ReservedOrUserEventNames<ReservedEvents, ListenEvents>
  >(event: Ev): ReservedOrUserListener<ReservedEvents, ListenEvents, Ev>[] {
    return this._listeners.get(event) || [];
  }
}

/**
 * This class extends the BaseEventEmitter abstract class, so a class extending `EventEmitter` can override the `emit`
 * method and still call `emitReserved()` (since it uses `super.emit()`)
 */
export class EventEmitter<
  ListenEvents extends EventsMap,
  EmitEvents extends EventsMap,
  ReservedEvents extends EventsMap = never
> extends BaseEventEmitter<ListenEvents, EmitEvents, ReservedEvents> {
  /**
   * Emits a reserved event.
   *
   * This method is `protected`, so that only a class extending `EventEmitter` can emit its own reserved events.
   *
   * @param event - Reserved event name
   * @param args - Arguments to emit along with the event
   * @protected
   */
  protected emitReserved<Ev extends EventNames<ReservedEvents>>(
    event: Ev,
    ...args: EventParams<ReservedEvents, Ev>
  ): boolean {
    return super.emit(event as EventNames<EmitEvents>, ...args);
  }
}
