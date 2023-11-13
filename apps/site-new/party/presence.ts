import type * as Party from "partykit/server";
import type {
  Metadata,
  Presence,
  User,
  // ClientMessage,
  PartyMessage,
} from "../src/interactive/presence/presence-schema";
import {
  clientMessageSchema,
  decodeMessage,
  encodePartyMessage,
} from "../src/interactive/presence/presence-schema";

export type ConnectionWithUser = Party.Connection<{
  metadata?: Metadata;
  presence?: Presence;
}>;

const BROADCAST_INTERVAL = 1000 / 60; // 60fps

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET",
  "Access-Control-Allow-Headers":
    "Origin, X-Requested-With, Content-Type, Accept",
};

// server.ts
export default class PresenceServer implements Party.Server {
  // eslint-disable-next-line no-useless-constructor
  constructor(public party: Party.Party) {}
  options: Party.ServerOptions = {
    hibernate: true,
  };

  // pending updates are stored in memory and sent every tick
  add: { [id: string]: User } = {};
  presence: { [id: string]: Presence } = {};
  remove: string[] = [];

  lastBroadcast = 0;
  interval: ReturnType<typeof setInterval> | null = null;

  onConnect(
    connection: Party.Connection,
    { request }: Party.ConnectionContext,
  ): void | Promise<void> {
    const metadata = { country: request.cf?.country ?? null } as Metadata;

    // Stash the metdata on the websocket
    connection.setState({ metadata });

    //console.log("onConnect", this.party.id, connection.id, country);
  }

  enqueueAdd(id: string, user: User) {
    this.add[id] = user;
  }

  enqueuePresence(id: string, presence: Presence) {
    this.presence[id] = presence;
  }

  enqueueRemove(id: string) {
    this.remove.push(id);
    delete this.presence[id];
  }

  getUser(connection: ConnectionWithUser): User {
    return {
      presence: connection.state?.presence ?? ({} as Presence),
      metadata: connection.state?.metadata ?? ({} as Metadata),
    };
  }

  onMessage(
    msg: string | ArrayBufferLike,
    connection: ConnectionWithUser,
  ): void | Promise<void> {
    //const message = JSON.parse(msg as string) as ClientMessage;
    const result = clientMessageSchema.safeParse(decodeMessage(msg));
    if (!result.success) return;
    const message = result.data;
    /*console.log(
      "onMessage",
      this.party.id,
      connection.id,
      JSON.stringify(message, null, 2)
    );*/
    switch (message.type) {
      case "join": {
        // Keep the presence on the websocket. onConnect will add metadata
        connection.setState((prevState) => ({
          ...prevState,
          presence: message.presence,
        }));
        this.enqueueAdd(connection.id, this.getUser(connection));
        // Reply with the current presence of all connections, including self
        const sync = {
          type: "sync",
          users: [...this.party.getConnections()].reduce(
            (acc, user) => ({ ...acc, [user.id]: this.getUser(user) }),
            {},
          ),
        } satisfies PartyMessage;
        //connection.send(JSON.stringify(sync));
        connection.send(encodePartyMessage(sync));
        break;
      }
      case "update": {
        // A presence update
        connection.setState((prevState) => {
          const presence = {
            ...(prevState?.presence ?? ({} as Presence)),
            ...message.presence,
          };
          this.enqueuePresence(connection.id, presence);
          return {
            ...prevState,
            presence,
          };
        });
        break;
      }
      default: {
        return;
      }
    }

    this.broadcast(); // don't await
  }

  onClose(connection: ConnectionWithUser): void | Promise<void> {
    this.enqueueRemove(connection.id);
    this.broadcast();
  }

  async broadcast() {
    // Broadcasts deltas. Looks at lastBroadcast
    // - If it's longer ago than BROADCAST_INTERVAL, broadcasts immediately
    // - If it's less than BROADCAST_INTERVAL ago, schedules an alarm
    //   to broadcast later
    const now = Date.now();
    const ago = now - this.lastBroadcast;
    if (ago >= BROADCAST_INTERVAL) {
      this._broadcast();
    } else {
      if (!this.interval) {
        this.interval = setInterval(() => {
          this._broadcast();
          if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
          }
        }, BROADCAST_INTERVAL - ago);
      }
    }
  }

  _broadcast() {
    this.lastBroadcast = Date.now();

    // Avoid the situation where there's only one connection and we're
    // rebroadcasting its own deltas to it
    const connections = [...this.party.getConnections()];
    const presenceUniqueIds = new Set(Object.keys(this.presence));
    if (
      connections.length === 1 &&
      this.remove.length === 0 &&
      Object.keys(this.add).length === 0 &&
      presenceUniqueIds.size === 1 &&
      presenceUniqueIds.has(connections[0].id)
    ) {
      this.presence = {};
      return;
    }

    const update = {
      type: "changes",
      add: this.add,
      presence: this.presence,
      remove: this.remove,
    } satisfies PartyMessage;
    //this.party.broadcast(JSON.stringify(update));
    this.party.broadcast(encodePartyMessage(update));
    this.add = {};
    this.presence = {};
    this.remove = [];
  }

  async onRequest(req: Party.Request) {
    if (req.method === "GET") {
      // For SSR, return the current presence of all connections
      const users = [...this.party.getConnections()].reduce(
        (acc, user) => ({ ...acc, [user.id]: this.getUser(user) }),
        {},
      );
      return Response.json({ users }, { status: 200, headers: CORS });
    }

    // respond to cors preflight requests
    if (req.method === "OPTIONS") {
      return Response.json({ ok: true }, { status: 200, headers: CORS });
    }

    return new Response("Method Not Allowed", { status: 405 });
  }
}

PresenceServer satisfies Party.Worker;
