// TODO: Make this less gross
import app from "../dist/index.html.txt";

// TODO: Parse on server to get better type information
// import { parse } from "@devtools-ds/object-parser";

import type {
  PartyConnection,
  PartyConnectionContext,
  PartyRequest,
  PartyServer,
  PartyWorker,
} from "partykit/server";

// const fields = (server: PartyServer) => {
//   const vals = {};
//   for (const key in server) {
//     vals[key] = server[key];
//   }

//   return vals;
// };

const render = async (server: PartyServer) => {
  const instance = { ...server };
  // @ts-expect-error lol
  instance.party = { ...server.party };
  // @ts-expect-error lol
  instance.party.storage = await instance.party.storage.list();

  //const data = await parse(instance);

  const json = JSON.stringify(instance);
  const html = app.replace("__DEVTOOLS_DATA__", json);
  return html;
};

export function Inspector<T extends PartyWorker>(constructor: T) {
  // @ts-expect-error idk
  return class InspectableServer extends constructor {
    async onConnect(connection: PartyConnection, ctx: PartyConnectionContext) {
      console.log("Connection made");
      if (super.onConnect) {
        await super.onConnect(connection, ctx);
      }
    }

    async onRequest(req: PartyRequest) {
      const url = new URL(req.url);
      if (url.searchParams.has("inspect")) {
        const html = await render(this);
        return new Response(html, {
          headers: {
            "content-type": "text/html",
          },
        });
      }

      if (super.onRequest) {
        return super.onRequest(req);
      }

      return new Response("Not found", { status: 404 });
    }
  };
}
