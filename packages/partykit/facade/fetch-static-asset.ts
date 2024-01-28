// @ts-expect-error We'll be replacing __STATIC_ASSET_MANIFEST__ with
// details about static assets
import StaticAssetManifest from "__STATIC_ASSETS_MANIFEST__";
import mime from "mime/lite";

import type * as Party from "../src/server";

declare const StaticAssetManifest: Party.StaticAssetsManifestType;

// The roomId is /party/[roomId] or /parties/[partyName]/[roomId]
function getRoomAndPartyFromPathname(pathname: string): {
  room: string;
  party: string;
} | null {
  // NOTE: keep in sync with ./source.ts
  // TODO: use a URLPattern here instead
  if (pathname.startsWith("/party/")) {
    const [_, __, roomId] = pathname.split("/");
    return {
      room: roomId,
      party: "main"
    };
  } else if (pathname.startsWith("/parties/")) {
    const [_, __, partyName, roomId] = pathname.split("/");
    return {
      room: roomId,
      party: partyName
    };
  }
  return null;
}

export default async function fetchStaticAsset<Env>(
  request: Party.Request,
  _env: Env,
  _ctx: ExecutionContext
): Promise<Response | null> {
  const SUPPORTED_METHODS = ["GET", "HEAD"];
  if (!SUPPORTED_METHODS.includes(request.method)) {
    return null;
  }

  const url = new URL(request.url);
  let response: Response | null = null;

  let filePath = decodeURIComponent(url.pathname);

  if (filePath.endsWith("/")) {
    filePath += "index.html";
  }

  if (filePath !== "/" && filePath.startsWith("/")) {
    filePath = filePath.substring(1);
  }

  if (filePath in StaticAssetManifest.assets) {
    response = await fetch(
      `${StaticAssetManifest.devServer}/${StaticAssetManifest.assets[filePath]}`
    );
  }

  if (
    StaticAssetManifest.singlePageApp === true &&
    response === null &&
    request.headers.get("Sec-Fetch-Mode") === "navigate"
  ) {
    // if path starts with /party/:id or /parties/:name/:id, we should skip
    const { room: roomId } = getRoomAndPartyFromPathname(`/${filePath}`) || {};

    if (!roomId) {
      response = await fetch(
        `${StaticAssetManifest.devServer}/${StaticAssetManifest.assets["index.html"]}`
      );
    } else if (filePath.endsWith(".html")) {
      response = await fetch(
        `${StaticAssetManifest.devServer}/${StaticAssetManifest.assets["index.html"]}`
      );
    } else if (!mime.getType(filePath)) {
      response = await fetch(
        `${StaticAssetManifest.devServer}/${StaticAssetManifest.assets["index.html"]}`
      );
    }
    // at this point we can give up
  }

  return response;
}
