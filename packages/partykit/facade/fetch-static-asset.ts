// @ts-expect-error We'll be replacing __STATIC_ASSET_MANIFEST__ with
// details about static assets
import StaticAssetManifest from "__STATIC_ASSETS_MANIFEST__";

import type { StaticAssetsManifestType } from "../src/server";

declare const StaticAssetManifest: StaticAssetsManifestType;

export default async function fetchStaticAsset<Env>(
  request: Request,
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

  return response;
}
