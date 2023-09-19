/* eslint-disable @typescript-eslint/no-explicit-any */
import type * as Party from "partykit/server";
import { Doc } from "yjs";
import { onConnect, unstable_getYDoc } from "y-partykit";

// type Constructor<T = NonNullable<unknown>> = new (...args: any[]) => T;

// function YServer() {
//   return function YServerDecorator<T extends Constructor>(Server: T) {
//     const BaseServer = Server as Party.Worker;
//     return class extends BaseServer {
//       constructor(...args: any[]) {
//         const party = args[0];
//         const yparty = new YParty(party);

//         // @ts-expect-error intentional
//         super(party, yparty);
//       }

//       async onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
//         if (super.onConnect) {
//           await super.onConnect(conn, ctx);
//         }
//       }
//     };
//   };
// }

class YParty {
  doc: Doc;
  constructor(public party: Party.Party) {}
  async load() {}
  handleConnect(connection: Party.Connection) {}
  handleMessage(message: string, sender: Party.Connection) {}
  handleClose(connection: Party.Connection) {}
}

export class YServer implements Party.Server {
  protected yjs: YParty;

  constructor(public party: Party.Party) {
    this.yjs = new YParty(party);
  }

  async onStart() {
    await this.yjs.load();
  }

  async onConnect(connection: Party.Connection) {
    this.yjs.handleConnect(connection);
  }

  async onMessage(message: string, sender: Party.Connection) {
    this.yjs.handleMessage(message, sender);
  }

  async onClose(connection: Party.Connection) {
    this.yjs.handleClose(connection);
  }

  onDocumentUpdate() {}
  onAwarenessUpdate() {}
}

export class IdealYjsServer extends YServer {
  async onStart() {
    await this.yjs.load();
  }

  async onRequest(req: Party.Request) {
    return new Response(
      this.yjs.doc?.getText("message").toJSON() ?? "not found"
    );
  }

  async onConnect(connection: Party.Connection) {
    await super.onConnect(connection);
  }
}

export default class YjsServer implements Party.Server {
  constructor(public party: Party.Party) {}
  doc: Doc | undefined;

  async onStart() {
    this.doc = await unstable_getYDoc(this.party, {
      persist: true,
    });
  }

  async onRequest(req: Party.Request) {
    const url = new URL(req.url);
    if (url.searchParams.has("mutate")) {
      const yMessage = this.doc?.getText("message");
      if (this.doc && yMessage) {
        this.doc.transact(() => {
          const now = Date.now().toString();
          yMessage.delete(0, now.length);
          yMessage.insert(0, now);
        });
      }
    }

    const text = this.doc?.getText("message").toJSON() ?? "not found";
    return new Response(text);
  }

  onConnect(connection: Party.Connection): void | Promise<void> {
    return onConnect(connection, this.party, {
      persist: true,
      load: async () => {
        return this.doc ?? new Doc();
      },
    });
  }
}
