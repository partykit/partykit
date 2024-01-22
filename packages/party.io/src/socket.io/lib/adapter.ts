import { generateId } from "../../engine.io";
import { EventEmitter } from "../../event-emitter";
import { getLogger } from "../../logger";
import { type Packet } from "../../socket.io-parser";
import { type Namespace } from "./namespace";
import { type Socket } from "./socket";

const DEFAULT_TIMEOUT_MS = 5000;

export type SocketId = string;
export type Room = string | number;

export interface BroadcastOptions {
  rooms: Set<Room>;
  except: Set<Room>;
  flags?: BroadcastFlags;
}

export interface BroadcastFlags {
  volatile?: boolean;
  local?: boolean;
  broadcast?: boolean;
  timeout?: number;
}

interface AdapterEvents {
  "create-room": (room: Room) => void;
  "delete-room": (room: Room) => void;
  "join-room": (room: Room, sid: SocketId) => void;
  "leave-room": (room: Room, sid: SocketId) => void;
  error: (err: Error) => void;
}

export class InMemoryAdapter extends EventEmitter<
  Record<never, never>,
  Record<never, never>,
  AdapterEvents
> {
  protected readonly nsp: Namespace;

  protected rooms: Map<Room, Set<SocketId>> = new Map();
  private sids: Map<SocketId, Set<Room>> = new Map();

  constructor(nsp: Namespace) {
    super();
    this.nsp = nsp;
  }

  /**
   * Returns the number of Socket.IO servers in the cluster
   */
  public serverCount(): Promise<number> {
    console.log("getting orig serverCount");
    return Promise.resolve(1);
  }

  /**
   * Adds a socket to a list of room.
   *
   * @param id - the socket ID
   * @param rooms - a set of rooms
   */
  public addAll(id: SocketId, rooms: Set<Room>): Promise<void> | void {
    let roomsForSid = this.sids.get(id);
    if (!roomsForSid) {
      this.sids.set(id, (roomsForSid = new Set()));
    }

    for (const room of rooms) {
      roomsForSid.add(room);

      let sidsForRoom = this.rooms.get(room);

      if (!sidsForRoom) {
        this.rooms.set(room, (sidsForRoom = new Set()));
        this.emitReserved("create-room", room);
      }
      if (!sidsForRoom.has(id)) {
        sidsForRoom.add(id);
        this.emitReserved("join-room", room, id);
      }
    }
  }

  /**
   * Removes a socket from a room.
   *
   * @param {SocketId} id     the socket id
   * @param {Room}     room   the room name
   */
  public del(id: SocketId, room: Room): Promise<void> | void {
    this.sids.get(id)?.delete(room);
    this.removeSidFromRoom(room, id);
  }

  private removeSidFromRoom(room: Room, id: SocketId) {
    const sids = this.rooms.get(room);

    if (!sids) {
      return;
    }

    const deleted = sids.delete(id);
    if (deleted) {
      this.emitReserved("leave-room", room, id);
    }
    if (sids.size === 0 && this.rooms.delete(room)) {
      this.emitReserved("delete-room", room);
    }
  }

  /**
   * Removes a socket from all rooms it's joined.
   *
   * @param id - the socket ID
   */
  public delAll(id: SocketId): void {
    const rooms = this.sids.get(id);

    if (!rooms) {
      return;
    }

    for (const room of rooms) {
      this.removeSidFromRoom(room, id);
    }

    this.sids.delete(id);
  }

  /**
   * Broadcasts a packet.
   *
   * Options:
   *  - `flags` {Object} flags for this packet
   *  - `except` {Array} sids that should be excluded
   *  - `rooms` {Array} list of rooms to broadcast to
   *
   * @param {Object} packet   the packet object
   * @param {Object} opts     the options
   */
  public broadcast(packet: Packet, opts: BroadcastOptions): void {
    // make a copy of the array, since the `encode()` method updates the array in place to gather binary elements
    // note: this won't work with nested binary elements
    const args = packet.data.slice();
    const encodedPackets = this.nsp._server._encoder.encode(packet);

    this.apply(opts, (socket) => {
      socket._notifyOutgoingListeners(args);
      socket.client._writeToEngine(encodedPackets, {
        volatile: opts.flags && opts.flags.volatile
      });
    });
  }

  /**
   * Broadcasts a packet and expects multiple acknowledgements.
   *
   * Options:
   *  - `flags` {Object} flags for this packet
   *  - `except` {Array} sids that should be excluded
   *  - `rooms` {Array} list of rooms to broadcast to
   *
   * @param {Object} packet   the packet object
   * @param {Object} opts     the options
   * @param clientCountCallback - the number of clients that received the packet
   * @param ack                 - the callback that will be called for each client response
   */
  public broadcastWithAck(
    packet: Packet,
    opts: BroadcastOptions,
    clientCountCallback: (clientCount: number) => void,
    ack: (...args: unknown[]) => void
  ) {
    const flags = opts.flags || {};
    const packetOpts = {
      preEncoded: true,
      volatile: flags.volatile
    };

    packet.nsp = this.nsp.name;
    // we can use the same id for each packet, since the _ids counter is common (no duplicate)
    packet.id = this.nsp._ids++;

    // make a copy of the array, since the `encode()` method updates the array in place to gather binary elements
    // note: this won't work with nested binary elements
    const args = packet.data.slice();
    const encodedPackets = this.nsp._server._encoder.encode(packet);
    let clientCount = 0;

    this.apply(opts, (socket) => {
      // track the total number of acknowledgements that are expected
      clientCount++;
      // call the ack callback for each client response
      socket._acks.set(packet.id!, ack);

      socket._notifyOutgoingListeners(args);
      socket.client._writeToEngine(encodedPackets, packetOpts);
    });

    clientCountCallback(clientCount);
  }

  /**
   * Gets the list of rooms a given socket has joined.
   *
   * @param {SocketId} id   the socket id
   */
  public socketRooms(id: SocketId): Set<Room> | undefined {
    return this.sids.get(id);
  }

  /**
   * Returns the matching socket instances
   *
   * @param opts - the filters to apply
   */
  public fetchSockets(opts: BroadcastOptions): Promise<Socket[]> {
    const sockets: Socket[] = [];

    this.apply(opts, (socket) => {
      sockets.push(socket);
    });

    return Promise.resolve(sockets);
  }

  /**
   * Makes the matching socket instances join the specified rooms
   *
   * @param opts - the filters to apply
   * @param rooms - the rooms to join
   */
  public addSockets(opts: BroadcastOptions, rooms: Room[]): void {
    this.apply(opts, (socket) => {
      socket.join(rooms);
    });
  }

  /**
   * Makes the matching socket instances leave the specified rooms
   *
   * @param opts - the filters to apply
   * @param rooms - the rooms to leave
   */
  public delSockets(opts: BroadcastOptions, rooms: Room[]): void {
    this.apply(opts, (socket) => {
      rooms.forEach((room) => socket.leave(room));
    });
  }

  /**
   * Makes the matching socket instances disconnect
   *
   * @param opts - the filters to apply
   * @param close - whether to close the underlying connection
   */
  public disconnectSockets(opts: BroadcastOptions, close: boolean): void {
    this.apply(opts, (socket) => {
      socket.disconnect(close);
    });
  }

  private apply(
    opts: BroadcastOptions,
    callback: (socket: Socket) => void
  ): void {
    const rooms = opts.rooms;
    const except = this.computeExceptSids(opts.except);

    if (rooms.size) {
      const ids = new Set();
      for (const room of rooms) {
        if (!this.rooms.has(room)) continue;

        for (const id of this.rooms.get(room)!) {
          if (ids.has(id) || except.has(id)) continue;
          const socket = this.nsp.sockets.get(id);
          if (socket) {
            callback(socket);
            ids.add(id);
          }
        }
      }
    } else {
      for (const [id] of this.sids) {
        if (except.has(id)) continue;
        const socket = this.nsp.sockets.get(id);
        if (socket) {
          callback(socket);
        }
      }
    }
  }

  private computeExceptSids(exceptRooms?: Set<Room>) {
    const exceptSids = new Set();
    if (exceptRooms && exceptRooms.size > 0) {
      for (const room of exceptRooms) {
        this.rooms.get(room)?.forEach((sid) => exceptSids.add(sid));
      }
    }
    return exceptSids;
  }

  /**
   * Send a packet to the other Socket.IO servers in the cluster
   * @param _packet - an array of arguments, which may include an acknowledgement callback at the end
   */
  public serverSideEmit(_packet: unknown[]): void {
    console.warn(
      "this adapter does not support the serverSideEmit() functionality"
    );
  }
}

export enum RequestType {
  BROADCAST,
  SOCKETS_JOIN,
  SOCKETS_LEAVE,
  DISCONNECT_SOCKETS,
  FETCH_SOCKETS,
  FETCH_SOCKETS_RESPONSE,
  SERVER_SIDE_EMIT,
  SERVER_SIDE_EMIT_RESPONSE,
  BROADCAST_CLIENT_COUNT,
  BROADCAST_ACK
}

export interface ClusterRequest {
  /**
   * The UID of the server that sends the request
   */
  uid: string;
  type: RequestType;
  data: Record<string, unknown>;
}

export interface ClusterResponse {
  type: RequestType;
  data: {
    requestId: string;
    [key: string]: unknown;
  };
}

interface PendingRequest {
  type: RequestType;
  resolve: () => void;
  timerId: ReturnType<typeof setTimeout>;
  expectedCount: number;
  currentCount: number;
  responses: unknown[];
}

interface AckRequest {
  clientCountCallback: (clientCount: number) => void;
  ack: (...args: unknown[]) => void;
}

function serializeSocket(socket: Socket) {
  return {
    id: socket.id,
    handshake: {
      headers: socket.handshake.headers,
      time: socket.handshake.time,
      address: socket.handshake.address,
      xdomain: socket.handshake.xdomain,
      secure: socket.handshake.secure,
      issued: socket.handshake.issued,
      url: socket.handshake.url,
      query: socket.handshake.query,
      auth: socket.handshake.auth
    },
    rooms: [...socket.rooms],
    data: socket.data
  };
}

export abstract class Adapter extends InMemoryAdapter {
  protected readonly uid: string;

  #pendingRequests = new Map<string, PendingRequest>();

  #ackRequests = new Map<string, AckRequest>();

  protected constructor(nsp: Namespace) {
    super(nsp);
    this.uid = generateId();
  }

  /**
   * Sends request to the other Socket.IO servers
   *
   * @param request
   * @protected
   */
  protected abstract publishRequest(request: ClusterRequest): void;

  protected abstract publishResponse(
    requesterUid: string,
    response: ClusterResponse
  ): void;

  override addSockets(opts: BroadcastOptions, rooms: Room[]) {
    super.addSockets(opts, rooms);

    if (opts.flags?.local) {
      return;
    }

    this.publishRequest({
      uid: this.uid,
      type: RequestType.SOCKETS_JOIN,
      data: {
        opts: {
          rooms: [...opts.rooms],
          except: [...opts.except]
        },
        rooms: [...rooms]
      }
    });
  }

  override delSockets(opts: BroadcastOptions, rooms: Room[]) {
    super.delSockets(opts, rooms);

    if (opts.flags?.local) {
      return;
    }

    this.publishRequest({
      uid: this.uid,
      type: RequestType.SOCKETS_LEAVE,
      data: {
        opts: {
          rooms: [...opts.rooms],
          except: [...opts.except]
        },
        rooms: [...rooms]
      }
    });
  }

  override disconnectSockets(opts: BroadcastOptions, close: boolean) {
    super.disconnectSockets(opts, close);

    if (opts.flags?.local) {
      return;
    }

    this.publishRequest({
      uid: this.uid,
      type: RequestType.DISCONNECT_SOCKETS,
      data: {
        opts: {
          rooms: [...opts.rooms],
          except: [...opts.except]
        },
        close
      }
    });
  }

  override async fetchSockets(opts: BroadcastOptions): Promise<Socket[]> {
    const localSockets = await super.fetchSockets(opts);

    if (opts.flags?.local) {
      return localSockets;
    }

    const expectedResponseCount = (await this.serverCount()) - 1;

    if (expectedResponseCount === 0) {
      return localSockets;
    }

    const requestId = generateId();

    return new Promise((resolve, reject) => {
      const timerId = setTimeout(() => {
        const storedRequest = this.#pendingRequests.get(requestId);
        if (storedRequest) {
          reject(
            new Error(
              `timeout reached: only ${storedRequest.currentCount} responses received out of ${storedRequest.expectedCount}`
            )
          );
          this.#pendingRequests.delete(requestId);
        }
      }, opts.flags?.timeout || DEFAULT_TIMEOUT_MS);

      const storedRequest = {
        type: RequestType.FETCH_SOCKETS,
        resolve: () => {
          return resolve(storedRequest.responses);
        },
        timerId,
        currentCount: 0,
        expectedCount: expectedResponseCount,
        responses: localSockets
      };
      this.#pendingRequests.set(requestId, storedRequest);

      this.publishRequest({
        uid: this.uid,
        type: RequestType.FETCH_SOCKETS,
        data: {
          opts: {
            rooms: [...opts.rooms],
            except: [...opts.except]
          },
          requestId
        }
      });
    });
  }

  override serverSideEmit(packet: unknown[]) {
    const withAck = typeof packet[packet.length - 1] === "function";

    if (withAck) {
      this.#serverSideEmitWithAck(packet).catch(() => {
        // ignore errors
      });
      return;
    }

    this.publishRequest({
      uid: this.uid,
      type: RequestType.SERVER_SIDE_EMIT,
      data: {
        packet
      }
    });
  }

  async #serverSideEmitWithAck(packet: unknown[]) {
    const ack = packet.pop() as (
      err: Error | null,
      response: unknown[]
    ) => void;
    const expectedResponseCount = (await this.serverCount()) - 1;

    if (expectedResponseCount === 0) {
      return ack(null, []);
    }

    const requestId = generateId();

    const timerId = setTimeout(() => {
      const storedRequest = this.#pendingRequests.get(requestId);
      if (storedRequest) {
        ack(
          new Error(
            `timeout reached: only ${storedRequest.currentCount} responses received out of ${storedRequest.expectedCount}`
          ),
          storedRequest.responses
        );
        this.#pendingRequests.delete(requestId);
      }
    }, DEFAULT_TIMEOUT_MS);

    const storedRequest = {
      type: RequestType.SERVER_SIDE_EMIT,
      resolve: () => {
        ack(null, storedRequest.responses);
      },
      timerId,
      currentCount: 0,
      expectedCount: expectedResponseCount,
      responses: []
    };

    this.#pendingRequests.set(requestId, storedRequest);

    this.publishRequest({
      uid: this.uid,
      type: RequestType.SERVER_SIDE_EMIT,
      data: {
        requestId, // the presence of this attribute defines whether an acknowledgement is needed
        packet
      }
    });
  }

  override broadcast(packet: Packet, opts: BroadcastOptions) {
    const onlyLocal = opts.flags?.local;

    if (!onlyLocal) {
      this.publishRequest({
        uid: this.uid,
        type: RequestType.BROADCAST,
        data: {
          packet,
          opts: {
            rooms: [...opts.rooms],
            except: [...opts.except],
            flags: opts.flags
          }
        }
      });
    }

    setTimeout(() => {
      super.broadcast(packet, opts);
    }, 0);
  }

  override broadcastWithAck(
    packet: Packet,
    opts: BroadcastOptions,
    clientCountCallback: (clientCount: number) => void,
    ack: (...args: unknown[]) => void
  ) {
    const onlyLocal = opts.flags?.local;

    if (!onlyLocal) {
      const requestId = generateId();

      this.publishRequest({
        uid: this.uid,
        type: RequestType.BROADCAST,
        data: {
          packet,
          requestId,
          opts: {
            rooms: [...opts.rooms],
            except: [...opts.except],
            flags: opts.flags
          }
        }
      });

      this.#ackRequests.set(requestId, {
        clientCountCallback,
        ack
      });

      // we have no way to know at this level whether the server has received an acknowledgement from each client, so we
      // will simply clean up the ackRequests map after the given delay
      setTimeout(() => {
        this.#ackRequests.delete(requestId);
      }, opts.flags!.timeout);
    }

    setTimeout(() => {
      super.broadcastWithAck(packet, opts, clientCountCallback, ack);
    }, 0);
  }

  protected async onRequest(request: ClusterRequest) {
    if (request.uid === this.uid) {
      getLogger("socket.io").debug(`[adapter] [${this.uid}] ignore self`);
      return;
    }

    getLogger("socket.io").debug(
      `[adapter] [${this.uid}] received request ${request.type} from ${request.uid}`
    );

    switch (request.type) {
      case RequestType.BROADCAST: {
        const withAck = request.data.requestId !== undefined;
        const packet = request.data.packet as Packet;
        const opts = request.data.opts as { rooms: string[]; except: string[] };

        if (withAck) {
          return super.broadcastWithAck(
            packet,
            {
              rooms: new Set(opts.rooms),
              except: new Set(opts.except)
            },
            (clientCount) => {
              getLogger("socket.io").debug(
                `[adapter] waiting for ${clientCount} client acknowledgements`
              );
              this.publishResponse(request.uid, {
                type: RequestType.BROADCAST_CLIENT_COUNT,
                data: {
                  requestId: request.data.requestId as string,
                  clientCount
                }
              });
            },
            (arg) => {
              getLogger("socket.io").debug(
                `[adapter] received one acknowledgement`
              );
              this.publishResponse(request.uid, {
                type: RequestType.BROADCAST_ACK,
                data: {
                  requestId: request.data.requestId as string,
                  packet: arg
                }
              });
            }
          );
        } else {
          return super.broadcast(packet, {
            rooms: new Set(opts.rooms),
            except: new Set(opts.except)
          });
        }
      }

      case RequestType.SOCKETS_JOIN: {
        const opts = request.data.opts as { rooms: string[]; except: string[] };
        const rooms = request.data.rooms as string[];

        getLogger("socket.io").debug(
          `[adapter] calling socketsJoin ${rooms} in ${opts.rooms} except ${opts.except}`
        );

        return super.addSockets(
          {
            rooms: new Set(opts.rooms),
            except: new Set(opts.except)
          },
          rooms
        );
      }

      case RequestType.SOCKETS_LEAVE: {
        const opts = request.data.opts as { rooms: string[]; except: string[] };
        const rooms = request.data.rooms as string[];

        getLogger("socket.io").debug(
          `[adapter] calling socketsLeave ${rooms} in ${opts.rooms} except ${opts.except}`
        );

        return super.delSockets(
          {
            rooms: new Set(opts.rooms),
            except: new Set(opts.except)
          },
          rooms
        );
      }

      case RequestType.DISCONNECT_SOCKETS: {
        const opts = request.data.opts as { rooms: string[]; except: string[] };
        const close = request.data.close as boolean;

        getLogger("socket.io").debug(
          `[adapter] calling disconnectSockets (close? ${close}) in ${opts.rooms} except ${opts.except}`
        );

        return super.disconnectSockets(
          {
            rooms: new Set(opts.rooms),
            except: new Set(opts.except)
          },
          close
        );
      }

      case RequestType.FETCH_SOCKETS: {
        const opts = request.data.opts as { rooms: string[]; except: string[] };

        getLogger("socket.io").debug(
          `[adapter] calling fetchSockets in [${opts.rooms.join(
            ","
          )}] except [${opts.except.join(",")}]`
        );

        const localSockets = await super.fetchSockets({
          rooms: new Set(opts.rooms),
          except: new Set(opts.except)
        });

        getLogger("socket.io").debug(
          `[adapter] responding to the fetchSockets request with ${localSockets.length} socket(s)`
        );

        this.publishResponse(request.uid, {
          type: RequestType.FETCH_SOCKETS_RESPONSE,
          data: {
            requestId: request.data.requestId as string,
            sockets: localSockets.map(serializeSocket)
          }
        });
        break;
      }

      case RequestType.SERVER_SIDE_EMIT: {
        const packet = request.data.packet as [string, ...unknown[]];
        const withAck = request.data.requestId !== undefined;

        if (!withAck) {
          this.nsp._onServerSideEmit(packet);
          return;
        }

        let called = false;
        const callback = (arg: unknown) => {
          // only one argument is expected
          if (called) {
            return;
          }
          called = true;

          this.publishResponse(request.uid, {
            type: RequestType.SERVER_SIDE_EMIT_RESPONSE,
            data: {
              requestId: request.data.requestId as string,
              packet: arg
            }
          });
        };

        packet.push(callback);
        this.nsp._onServerSideEmit(packet);
        break;
      }

      default:
        getLogger("socket.io").debug(
          `[adapter] unknown request type: ${request.type}`
        );
        break;
    }
  }

  protected onResponse(response: ClusterResponse) {
    const requestId = response.data.requestId as string;

    getLogger("socket.io").debug(
      `[adapter] [${this.uid}] received response ${response.type} to request ${requestId}`
    );

    switch (response.type) {
      case RequestType.FETCH_SOCKETS_RESPONSE:
      case RequestType.SERVER_SIDE_EMIT_RESPONSE: {
        const request = this.#pendingRequests.get(requestId);

        if (!request) {
          getLogger("socket.io").debug(
            `[adapter] unknown request id: ${requestId}`
          );
          return;
        }

        if (response.type === RequestType.FETCH_SOCKETS_RESPONSE) {
          request.responses.push(...(response.data.sockets as Socket[]));
        } else {
          request.responses.push(response.data.packet);
        }

        if (++request.currentCount === request.expectedCount) {
          clearTimeout(request.timerId);
          request.resolve();
          this.#pendingRequests.delete(requestId);
        }

        break;
      }

      case RequestType.BROADCAST_CLIENT_COUNT:
        return this.#ackRequests
          .get(requestId)
          ?.clientCountCallback(response.data.clientCount as number);

      case RequestType.BROADCAST_ACK:
        return this.#ackRequests.get(requestId)?.ack(response.data.packet);

      default:
        getLogger("socket.io").debug(
          `[adapter] unknown response type: ${response.type}`
        );
        break;
    }
  }
}
