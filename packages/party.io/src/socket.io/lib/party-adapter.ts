import type * as Party from "partykit/server";

import { getLogger } from "../../logger";
import { decode, encode } from "../../msgpack";
import { Adapter } from "../../socket.io";
import { type Packet } from "../../socket.io-parser";
import { RequestType } from "../../socket.io/lib/adapter";

import type { BroadcastOptions, Namespace } from "../../socket.io";
import type {
  ClusterRequest,
  ClusterResponse
} from "../../socket.io/lib/adapter";

export interface PartyAdapterOptions {
  /**
   * The name of the key to pub/sub events on as prefix
   * @default "socket.io"
   */
  key: string;
  partyId?: string;
}

export function createAdapter<
  ListenEvents,
  EmitEvents,
  ServerSideEvents,
  SocketData
>(
  lobby: Party.FetchLobby,
  ctx: Party.ExecutionContext,
  opts?: Partial<PartyAdapterOptions>
) {
  const options = Object.assign(
    {
      key: "socket.io"
    },
    opts
  );
  return function (nsp: Namespace) {
    return new PartyAdapter(nsp, lobby, options);
  };
}

class PartyAdapter extends Adapter {
  connector: WebSocket | undefined;
  private readonly opts: PartyAdapterOptions;

  private readonly broadcastChannel: string;
  private readonly requestChannel: string;
  private readonly responseChannel: string;

  private readonly partyLobby: Party.FetchLobby;
  partyName: string;

  constructor(
    nsp: Namespace,
    lobby: Party.FetchLobby,
    opts: PartyAdapterOptions
  ) {
    super(nsp);

    this.partyLobby = lobby;
    this.partyName = `nsp-${
      opts.partyId ? `-${opts.partyId}` : ""
    }${nsp.name.replaceAll("/", "-")}`;

    this.#initialiseConnector(nsp, lobby).catch((err) => {
      console.error("could not initialise connector", err);
      this.emitReserved("error", err);
    });

    this.opts = opts;

    this.broadcastChannel = `${opts.key}#${nsp.name}#`;
    this.requestChannel = `${opts.key}-request#${nsp.name}#`;
    this.responseChannel = `${opts.key}-response#${nsp.name}#${this.uid}#`;

    getLogger("socket.io").debug(
      `[party-adapter] [${this.uid}] subscribing to ${
        this.broadcastChannel + "*"
      }, ${this.requestChannel} and ${this.responseChannel}`
    );
  }

  messageBuffer: Array<string | ArrayBuffer | ArrayBufferView> = [];

  #sendMessage(msg: string | ArrayBuffer | ArrayBufferView) {
    if (this.connector) {
      this.connector.send(msg);
    } else {
      this.messageBuffer.push(msg);
    }
  }

  async #initialiseConnector(nsp: Namespace, lobby: Party.FetchLobby) {
    // TODO: reconnect aafter it drops
    const connector = await lobby.parties.main.get(this.partyName).socket();

    this.connector = connector;

    connector.addEventListener("error", (err) => {
      console.error("error when connecting to party", this.partyName);
      console.error(err.message);
      // this.emitReserved("error", err);
    });

    connector.addEventListener("message", (event) => {
      try {
        // get channel from event.data
        const { data } = event;
        if (typeof data === "string") {
          // we know that this can only be for requestchannel or responseChannel
          const msg = JSON.parse(data) as Record<string, unknown>;
          if (msg.channel === this.requestChannel) {
            this.#onRawRequest(msg);
          } else if (msg.channel === this.responseChannel) {
            this.#onRawResponse(msg);
          } else {
            getLogger("socket.io").debug(
              `[party-adapter] [${this.uid}] ignoring message ${data}`
            );
            return;
          }
        } else {
          // this can be a broadcast message, or a req/res message
          const msg = decode(data) as
            | Record<string, unknown>
            | [string, string, Packet, BroadcastOptions];
          if (Array.isArray(msg)) {
            this.#onBroadcastMessage(msg[0], msg[1], msg[2], msg[3]);
          } else {
            if (msg.channel === this.requestChannel) {
              this.#onRawRequest(msg);
            } else if (msg.channel === this.responseChannel) {
              this.#onRawResponse(msg);
            } else {
              getLogger("socket.io").debug(
                `[party-adapter] [${this.uid}] ignoring message ${data}`
              );
              return;
            }
          }
        }
      } catch (err) {
        console.error(err);
        this.emitReserved("error", err as Error);
      }
    });

    // send any buffered messages
    this.messageBuffer.forEach((msg) => {
      this.#sendMessage(msg);
    });
    this.messageBuffer = [];
  }

  /**
   * Encode the request payload to match the format of the Node.js implementation
   *
   * @param request
   * @private
   */
  #encodeRequest(request: ClusterRequest): [string, string | Uint8Array] {
    switch (request.type) {
      case RequestType.BROADCAST: {
        const withAck = request.data.requestId !== undefined;

        if (withAck) {
          const payload = new Uint8Array(
            encode({
              channel: this.requestChannel,
              uid: request.uid,
              type: 7,
              requestId: request.data.requestId,
              packet: request.data.packet,
              opts: request.data.opts
            })
          );

          return [this.requestChannel, payload];
        } else {
          const opts = request.data.opts as { rooms: string[] };
          let channel = this.broadcastChannel;
          if (opts.rooms && opts.rooms.length === 1) {
            channel += opts.rooms[0] + "#";
          }
          const payload = new Uint8Array(
            encode([channel, request.uid, request.data.packet, opts])
          );

          return [channel, payload];
        }
      }

      case RequestType.SOCKETS_JOIN: {
        const payload = JSON.stringify({
          channel: this.requestChannel,
          uid: request.uid,
          type: 2,
          opts: request.data.opts,
          rooms: request.data.rooms
        });

        return [this.requestChannel, payload];
      }

      case RequestType.SOCKETS_LEAVE: {
        const payload = JSON.stringify({
          channel: this.requestChannel,
          uid: request.uid,
          type: 3,
          opts: request.data.opts,
          rooms: request.data.rooms
        });

        return [this.requestChannel, payload];
      }

      case RequestType.DISCONNECT_SOCKETS: {
        const payload = JSON.stringify({
          channel: this.requestChannel,
          uid: request.uid,
          type: 4,
          opts: request.data.opts,
          close: request.data.close
        });

        return [this.requestChannel, payload];
      }

      case RequestType.FETCH_SOCKETS: {
        const payload = JSON.stringify({
          channel: this.requestChannel,
          uid: request.uid,
          requestId: request.data.requestId,
          type: 5,
          opts: request.data.opts
        });

        return [this.requestChannel, payload];
      }

      case RequestType.SERVER_SIDE_EMIT: {
        const payload = JSON.stringify({
          channel: this.requestChannel,
          uid: request.uid,
          type: 6,
          data: request.data.packet,
          requestId: request.data.requestId
        });

        return [this.requestChannel, payload];
      }

      default:
        throw "should not happen";
    }
  }

  /**
   * Encode the response payload to match the format of the Node.js implementation
   *
   * @param response
   * @private
   */
  static #encodeResponse(
    channel: string,
    response: ClusterResponse
  ): string | Uint8Array {
    switch (response.type) {
      case RequestType.FETCH_SOCKETS_RESPONSE: {
        return JSON.stringify({
          channel,
          requestId: response.data.requestId,
          sockets: response.data.sockets
        });
      }

      case RequestType.SERVER_SIDE_EMIT_RESPONSE: {
        return JSON.stringify({
          channel,
          type: 6,
          requestId: response.data.requestId,
          data: response.data.packet
        });
      }

      case RequestType.BROADCAST_CLIENT_COUNT: {
        return JSON.stringify({
          channel,
          type: 8,
          requestId: response.data.requestId,
          clientCount: response.data.clientCount
        });
      }

      case RequestType.BROADCAST_ACK: {
        return new Uint8Array(
          encode({
            channel,
            type: 9,
            requestId: response.data.requestId,
            packet: response.data.packet
          })
        );
      }

      default:
        throw "should not happen";
    }
  }

  /**
   * Called with a subscription message
   *
   * @private
   */
  #onBroadcastMessage(
    channel: string,
    uid: string,
    packet: Packet,
    opts: BroadcastOptions
  ) {
    const room = channel.slice(this.broadcastChannel.length, -1);
    if (room !== "" && !this.#hasRoom(room)) {
      return getLogger("socket.io").debug(
        `[party-adapter] [${this.uid}] ignore unknown room ${room}`
      );
    }

    return this.onRequest({
      uid,
      type: RequestType.BROADCAST,
      data: {
        packet,
        opts
      }
    });
  }

  /**
   * Checks whether the room exists (as it is encoded to a string in the broadcast method)
   *
   * @param room
   * @private
   */
  #hasRoom(room: string): boolean {
    const numericRoom = parseFloat(room);
    const hasNumericRoom = !isNaN(numericRoom) && this.rooms.has(numericRoom);
    return hasNumericRoom || this.rooms.has(room);
  }

  /**
   * Called on request from another node
   *
   * @private
   */
  #onRawRequest(rawRequest: Record<string, unknown>) {
    const request = PartyAdapter.#decodeRequest(rawRequest);

    if (request) {
      return this.onRequest(request);
    }
  }

  /**
   * Decode request payload
   *
   * @param rawRequest
   * @private
   */
  static #decodeRequest(
    rawRequest: Record<string, unknown>
  ): ClusterRequest | null {
    switch (rawRequest.type) {
      case 2:
        return {
          uid: rawRequest.uid as string,
          type: RequestType.SOCKETS_JOIN,
          data: {
            opts: rawRequest.opts,
            rooms: rawRequest.rooms
          }
        };

      case 3:
        return {
          uid: rawRequest.uid as string,
          type: RequestType.SOCKETS_LEAVE,
          data: {
            opts: rawRequest.opts,
            rooms: rawRequest.rooms
          }
        };

      case 4:
        return {
          uid: rawRequest.uid as string,
          type: RequestType.DISCONNECT_SOCKETS,
          data: {
            opts: rawRequest.opts,
            close: rawRequest.close
          }
        };

      case 5:
        return {
          uid: rawRequest.uid as string,
          type: RequestType.FETCH_SOCKETS,
          data: {
            requestId: rawRequest.requestId,
            opts: rawRequest.opts
          }
        };

      case 6:
        return {
          uid: rawRequest.uid as string,
          type: RequestType.SERVER_SIDE_EMIT,
          data: {
            requestId: rawRequest.requestId,
            packet: rawRequest.data
          }
        };

      case 7:
        return {
          uid: rawRequest.uid as string,
          type: RequestType.BROADCAST,
          data: {
            opts: rawRequest.opts,
            requestId: rawRequest.requestId,
            packet: rawRequest.packet
          }
        };

      default:
        return null;
    }
  }

  /**
   * Called on request from another node
   *
   * @private
   */
  #onRawResponse(rawResponse: Record<string, unknown>) {
    const response = PartyAdapter.#decodeResponse(rawResponse);

    if (response) {
      this.onResponse(response);
    }
  }

  static #decodeResponse(
    rawResponse: Record<string, unknown>
  ): ClusterResponse | null {
    // the Node.js implementation of fetchSockets() does not include the type of the request
    // reference: https://github.com/socketio/socket.io-redis-adapter/blob/b4215cdbc00af96eac37a0b9cc0fbcb793384b53/lib/index.ts#L349-L361
    const responseType = rawResponse.type || RequestType.FETCH_SOCKETS;

    switch (responseType) {
      case RequestType.FETCH_SOCKETS:
        return {
          type: RequestType.FETCH_SOCKETS_RESPONSE,
          data: {
            requestId: rawResponse.requestId as string,
            sockets: rawResponse.sockets
          }
        };

      case RequestType.SERVER_SIDE_EMIT:
        return {
          type: RequestType.SERVER_SIDE_EMIT_RESPONSE,
          data: {
            requestId: rawResponse.requestId as string,
            packet: rawResponse.data
          }
        };

      case 8:
        return {
          type: RequestType.BROADCAST_CLIENT_COUNT,
          data: {
            requestId: rawResponse.requestId as string,
            clientCount: rawResponse.clientCount
          }
        };

      case 9:
        return {
          type: RequestType.BROADCAST_ACK,
          data: {
            requestId: rawResponse.requestId as string,
            packet: rawResponse.packet
          }
        };

      default:
        return null;
    }
  }

  override publishRequest(request: ClusterRequest) {
    const [channel, payload] = this.#encodeRequest(request);

    getLogger("socket.io").debug(
      `[party-adapter] [${this.uid}] sending request type ${request.type} to channel ${channel}`
    );
    try {
      this.#sendMessage(payload);
    } catch (err) {
      this.emitReserved("error", err as Error);
    }

    // this.pubClient.publish(channel, payload).catch((err) => {
    //   this.emitReserved("error", err);
    // });
  }

  override publishResponse(requesterUid: string, response: ClusterResponse) {
    // matches the behavior of the Node.js implementation with publishOnSpecificResponseChannel: true
    const channel = `${this.opts.key}-response#${this.nsp.name}#${requesterUid}#`;
    const payload = PartyAdapter.#encodeResponse(channel, response);

    getLogger("socket.io").debug(
      `[party-adapter] [${this.uid}] sending response type ${response.type} to channel ${channel}`
    );

    try {
      this.#sendMessage(payload);
    } catch (err) {
      console.error(err);
      this.emitReserved("error", err as Error);
    }
  }
  override async serverCount(): Promise<number> {
    const countRes = await this.partyLobby.parties.main
      .get(this.partyName)
      .fetch("/count", {
        method: "POST"
      });
    const count = await countRes.json<number>();

    if (isNaN(count)) {
      throw new Error(
        `invalid response from party ${this.partyName} when fetching server count`
      );
    }

    getLogger("socket.io").debug(
      `[party-adapter] [${this.uid}] there are ${count} server(s) in the cluster`
    );
    return count;
  }
}
