import open from "open";
import http from "http";
import getPort from "get-port";
import type { Socket } from "net";

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

          const url = new URL(`http://localhost${req.url}`);
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
          server.close(); // TODO: Autoclose server after delay
          server.unref();
          sockets.forEach((s) => s.destroy());
          sockets = [];
        }
      })
      .listen(port); // static local port

    server.on("connection", function (socket) {
      // Add a newly connected socket
      sockets.push(socket);
      socket.on("close", () => {
        sockets = sockets.filter((s) => s !== socket);
        socket.destroy();
      });
    });

    const redirectUrl = `http://localhost:${port}/device/callback`;
    const loginUrl = `http://localhost:3000/login/device?redirectUrl=${encodeURIComponent(
      redirectUrl
    )}`;

    open(loginUrl).catch(() => {
      console.error(
        `Failed to open a browser, please visit the following page to complete the login process: ${loginUrl}`
      );
    });
  });
}
