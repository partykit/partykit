import { Namespace } from "./namespace";
import { Server } from "./server";

import type {
  DefaultEventsMap,
  EventNames,
  EventParams,
  EventsMap
} from "../../event-emitter";

export class ParentNamespace<
  ListenEvents extends EventsMap = DefaultEventsMap,
  EmitEvents extends EventsMap = DefaultEventsMap,
  ServerSideEvents extends EventsMap = DefaultEventsMap,
  SocketData = unknown
> extends Namespace<ListenEvents, EmitEvents, ServerSideEvents, SocketData> {
  private static count = 0;

  private children: Set<
    Namespace<ListenEvents, EmitEvents, ServerSideEvents, SocketData>
  > = new Set();

  constructor(
    server: Server<ListenEvents, EmitEvents, ServerSideEvents, SocketData>
  ) {
    super(server, "/_" + ParentNamespace.count++);
    // this.adapter = {
    //   broadcast(packet: Packet, opts: BroadcastOptions) {
    //     this.children.forEach((nsp: Namespace) => {
    //       nsp.adapter.broadcast(packet, opts);
    //     });
    //   }
    // };
  }

  public emit<Ev extends EventNames<EmitEvents>>(
    ev: Ev,
    ...args: EventParams<EmitEvents, Ev>
  ): boolean {
    this.children.forEach((nsp) => {
      nsp.emit(ev, ...args);
    });

    return true;
  }

  /* private */ _createChild(
    name: string
  ): Namespace<ListenEvents, EmitEvents, ServerSideEvents, SocketData> {
    const namespace = new Namespace(this._server, name);
    namespace._fns = this._fns.slice(0);
    this.listeners("connect").forEach((listener) =>
      namespace.on("connect", listener)
    );
    this.listeners("connection").forEach((listener) =>
      namespace.on("connection", listener)
    );
    this.children.add(namespace);
    this._server._nsps.set(name, namespace);
    return namespace;
  }

  // fetchSockets(): Promise<RemoteSocket<EmitEvents, SocketData>[]> {
  //   // note: we could make the fetchSockets() method work for dynamic namespaces created with a regex (by sending the
  //   // regex to the other Socket.IO servers, and returning the sockets of each matching namespace for example), but
  //   // the behavior for namespaces created with a function is less clear
  //   // note²: we cannot loop over each children namespace, because with multiple Socket.IO servers, a given namespace
  //   // may exist on one node but not exist on another (since it is created upon client connection)
  //   throw new Error("fetchSockets() is not supported on parent namespaces");
  // }
}
