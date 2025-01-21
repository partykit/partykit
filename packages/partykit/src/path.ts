import path from "node:path";

/**
 * The __RELATIVE_PACKAGE_PATH__ is defined either in the esbuild config (for production)
 * or the vitest.setup.ts (for unit testing).
 *
 * @see https://github.com/cloudflare/workers-sdk/blob/main/packages/wrangler/src/paths.ts#L61
 */
declare const __RELATIVE_PACKAGE_PATH__: string;

/**
 * Use this function (rather than Node.js constants like `__dirname`) to specify
 * paths that are relative to the base path of the Partykit package.
 *
 * It is important to use this function because it reliably maps to the root of the package
 * no matter whether the code has been bundled or not.
 *
 * @see https://github.com/cloudflare/workers-sdk/blob/main/packages/wrangler/src/paths.ts#L70
 * @returns The base path of the Partykit package.
 */
export function getBasePath(): string {
  return path.resolve(__dirname, __RELATIVE_PACKAGE_PATH__);
}
