import http from "http";

import getPort from "get-port";
import open from "open";

import type { Socket } from "net";

declare const PARTYKIT_DASHBOARD_BASE: string | undefined;

const DASHBOARD_BASE =
  process.env.PARTYKIT_DASHBOARD_BASE || PARTYKIT_DASHBOARD_BASE;

if (!DASHBOARD_BASE) {
  throw new Error("PARTYKIT_DASHBOARD_BASE not defined");
}

export async function signInWithBrowser(mode: "cli" | "token"): Promise<
  | {
      token: string;
      teamId: string;
    }
  | { aborted: true }
> {
  const port = await getPort({ port: [1998, 1997, 1996] });

  let sockets: Socket[] = [];

  return new Promise((resolve, reject) => {
    // create a minimal web server to handle the callback from the browser
    const server = http
      .createServer((req, res) => {
        if (!req.url?.startsWith("/device/callback?")) {
          return;
        }

        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Headers", "Authorization");

        // https://developer.chrome.com/blog/private-network-access-preflight/
        res.setHeader("Access-Control-Allow-Private-Network", "true");

        if (req.method === "OPTIONS") {
          res.statusCode = 204;
          res.end();
        }

        if (req.method === "POST" || req.method === "GET") {
          try {
            // "host" is arbitrary here, added just so we can parse the url
            const url = new URL(`http://host${req.url}`);
            const error = url.searchParams.get("error");
            if (error) {
              res.statusCode = 200;
              res.end("OK");
              resolve({ aborted: true });
            } else {
              const token = url.searchParams.get("token");
              const teamId = url.searchParams.get("teamId");
              if (token && teamId) {
                if (req.method === "POST") {
                  // by default, the browser tries to perform the callback as a fetch POST request,
                  // in which case we can just respond with a 200 OK, and the caller will decide
                  // whether to redirect
                  //
                  // NOTE: If we ever need to return an error from here, we need to make sure not
                  // to kill the server, as the client is likely to follow up with a fallback GET request
                  res.statusCode = 200;
                  res.end("You are now logged in.");
                } else {
                  // handle a fallback get request, which happens as a browser navigation event, so
                  // we redirect the user back to the success page.
                  //
                  // if we the client didn't provide a redirect url, we redirect to the dashboard home
                  let successRedirectUrl =
                    url.searchParams.get("redirect") ?? "";
                  if (!successRedirectUrl.startsWith("/")) {
                    successRedirectUrl = `/${successRedirectUrl}`;
                  }
                  res
                    .writeHead(302, {
                      Location: `${DASHBOARD_BASE}${successRedirectUrl}`
                    })
                    .end();
                }

                resolve({ token, teamId });
              } else {
                res.statusCode = 400;
                res.end("Invalid parameters");
                reject(new Error("Invalid parameters"));
              }
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
    const loginUrl = `${DASHBOARD_BASE}/login/device?mode=${mode}&redirectUrl=${encodeURIComponent(
      redirectUrl
    )}`;

    open(loginUrl).catch(() => {
      console.error(
        `Failed to open a browser, please visit the following page to complete the login process: ${loginUrl}`
      );
    });
  });
}
