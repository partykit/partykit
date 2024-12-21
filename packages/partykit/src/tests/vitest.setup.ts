/**
 * The relative path between the bundled code and the Partykit package.
 * This is used as a reliable way to compute paths relative to the Partykit package
 * in the source files, rather than relying upon `__dirname` which can change depending
 * on whether the source files have been bundled and the location of the outdir.
 *
 * This is exposed in the source via the `getBasePath()` function, which should be used
 * in place of `__dirname` and similar Node.js constants.
 *
 * @see https://github.com/cloudflare/workers-sdk/blob/main/packages/wrangler/src/__tests__/vitest.setup.ts#L21
 */
(
  global as unknown as { __RELATIVE_PACKAGE_PATH__: string }
).__RELATIVE_PACKAGE_PATH__ = "..";
