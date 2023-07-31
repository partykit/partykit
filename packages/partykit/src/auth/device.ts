import open from "open";
import http from "http";
import getPort from "get-port";
import type { Socket } from "net";

declare const PARTYKIT_DASHBOARD_BASE: string | undefined;

const DASHBOARD_BASE =
  process.env.PARTYKIT_DASHBOARD_BASE || PARTYKIT_DASHBOARD_BASE;

if (!DASHBOARD_BASE) {
  throw new Error("PARTYKIT_DASHBOARD_BASE not defined");
}

export async function signInWithBrowser(): Promise<string> {
  const port = await getPort({ port: [1998, 1997, 1996] });

  let sockets: Socket[] = [];

  return new Promise((resolve, reject) => {
    // create a minimal web server to handle the callback from the browser
    const server = http
      .createServer((req, res) => {
        try {
          if (!req.url?.startsWith("/device/callback?")) {
            return;
          }

          // "host" is arbitrary here, added just so we can parse the url
          const url = new URL(`http://host${req.url}`);
          const token = url.searchParams.get("token");

          if (token) {
            res.statusCode = 200;
            res.end("OK");
            resolve(token);
          } else {
            res.statusCode = 400;
            res.end("Missing token");
            reject();
          }
        } catch (e) {
          reject(e);
        } finally {
          // ensure all connections are closed to allow process to exit cleanly
          server.close();
          server.unref();
          sockets.forEach((s) => s.destroy());
          sockets = [];
        }
      })
      .listen(port);

    server.on("connection", function (socket) {
      // track live connections
      sockets.push(socket);
      socket.on("close", () => {
        sockets = sockets.filter((s) => s !== socket);
        socket.destroy();
      });
    });

    // the local server url the login flow will redirect back to
    const redirectUrl = `http://localhost:${port}/device/callback`;

    // the remote server url that will handle the login flow
    const loginUrl = `${DASHBOARD_BASE}/login/device?redirectUrl=${encodeURIComponent(
      redirectUrl
    )}`;

    open(loginUrl).catch(() => {
      console.error(
        `Failed to open a browser, please visit the following page to complete the login process: ${loginUrl}`
      );
    });
  });
}
