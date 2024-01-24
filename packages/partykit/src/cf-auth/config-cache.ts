import { mkdirSync, readFileSync, rmSync, writeFileSync } from "fs";
import * as path from "path";

import { findUpSync } from "find-up";

import { CI } from "../is-ci";
import isInteractive from "../is-interactive";

let cacheMessageShown = false;

let __cacheFolder: string | null | undefined;
function getCacheFolder() {
  if (__cacheFolder || __cacheFolder === null) return __cacheFolder;

  const closestNodeModulesDirectory = findUpSync("node_modules", {
    type: "directory"
  });
  __cacheFolder = closestNodeModulesDirectory
    ? path.join(closestNodeModulesDirectory, ".cache/wrangler")
    : null;

  if (!__cacheFolder) {
    console.debug("No folder available to cache configuration");
  }
  return __cacheFolder;
}

const arrayFormatter = new Intl.ListFormat("en", {
  style: "long",
  type: "conjunction"
});

function showCacheMessage(fields: string[], folder: string) {
  if (!cacheMessageShown && isInteractive() && !CI.isCI()) {
    if (fields.length > 0) {
      console.debug(
        `Retrieving cached values for ${arrayFormatter.format(
          fields
        )} from ${path.relative(process.cwd(), folder)}`
      );
      cacheMessageShown = true;
    }
  }
}

export function getConfigCache<T>(fileName: string): Partial<T> {
  try {
    const cacheFolder = getCacheFolder();
    if (cacheFolder) {
      const configCacheLocation = path.join(cacheFolder, fileName);
      const configCache = JSON.parse(
        readFileSync(configCacheLocation, "utf-8")
      ) as Partial<T>;
      showCacheMessage(Object.keys(configCache), cacheFolder);
      return configCache;
    } else return {};
  } catch (err) {
    return {};
  }
}

export function saveToConfigCache<T>(
  fileName: string,
  newValues: Partial<T>
): void {
  const cacheFolder = getCacheFolder();
  if (cacheFolder) {
    console.debug(`Saving to cache: ${JSON.stringify(newValues)}`);
    const configCacheLocation = path.join(cacheFolder, fileName);
    const existingValues = getConfigCache(fileName);

    mkdirSync(path.dirname(configCacheLocation), { recursive: true });
    writeFileSync(
      configCacheLocation,
      JSON.stringify({ ...existingValues, ...newValues }, null, 2)
    );
  }
}

export function purgeConfigCaches() {
  const cacheFolder = getCacheFolder();
  if (cacheFolder) {
    rmSync(cacheFolder, { recursive: true, force: true });
  }
  __cacheFolder = undefined;
}
