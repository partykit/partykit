import * as crypto from "crypto";
import * as fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import React from "react";
import chalk from "chalk";
import detectIndent from "detect-indent";
import { execaCommand, execaCommandSync } from "execa";
import { findUpSync } from "find-up";
import { Box, render, Text } from "ink";
import SelectInput from "ink-select-input";
import limit from "p-limit";
import retry from "p-retry";
import { onExit } from "signal-exit";
import { fetch, File, FormData } from "undici";
import detectPackageManager from "which-pm-runs";
import WebSocket from "ws";

import { version as packageVersion } from "../package.json";
import { baseNodeBuiltins } from "./base-builtins";
import {
  createClerkServiceTokenSession,
  getConfig,
  getConfigPath,
  getUser,
  getUserConfig
} from "./config";
import { Dev } from "./dev";
import { fetchResult } from "./fetchResult";
import InkTable from "./ink-table";
import { ConfigurationError, logger } from "./logger";
import nodejsCompatPlugin from "./nodejs-compat";
import { translateCLICommandToFilterMessage } from "./tail/filters";
import { jsonPrintLogs, prettyPrintLogs } from "./tail/printing";

import type { DevProps } from "./dev";
import type { StaticAssetsManifestType } from "./server";
import type { TailFilterMessage } from "./tail/filters";
import type { BuildOptions } from "esbuild";
import type { RawData } from "ws";

export { Dev };
export type { DevProps };

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// duplicate dev.tsx
function* findAllFiles(
  root: string,
  { ignore: _ignore }: { ignore?: string[] } = {}
) {
  const dirs = [root];
  while (dirs.length > 0) {
    const dir = dirs.pop()!;
    const files = fs.readdirSync(dir);
    // TODO: handle ignore arg
    for (const file of files) {
      if (file.startsWith(".")) {
        continue;
      }

      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        if (file === "node_modules") {
          continue;
        }
        dirs.push(filePath);
      } else {
        yield path.relative(root, filePath).replace(/\\/g, "/"); // windows;
      }
    }
  }
}

async function installWithPackageManager({
  pkgManager,
  cwd
}: {
  pkgManager: string;
  cwd: string;
}) {
  if (pkgManager === "yarn") ensureYarnLock({ cwd });
  return execaCommand(
    `${pkgManager} install${pkgManager === "npm" ? " --no-fund" : ""}`,
    {
      cwd,
      timeout: 90_000,
      stdio: "inherit"
    }
  );
}

function ensureYarnLock({ cwd }: { cwd: string }) {
  const yarnLock = findUpSync("yarn.lock", { cwd });
  if (yarnLock) return;
  return fs.writeFileSync(path.join(cwd, "yarn.lock"), "", {
    encoding: "utf-8"
  });
}

const MissingProjectNameError = `Missing project name, please specify "name" in your config, or pass it in via the CLI with --name <name>`;
const MissingEntryPointError = `Missing entry point, please specify "main" in your config, or pass it in via the CLI`;

export async function init(options: {
  yes: boolean | undefined;
  name: string | undefined;
  dryRun: boolean | undefined;
}) {
  // check if we're inside an existing project
  // by looking for a package.json
  const packageJsonPath = findUpSync("package.json");

  // check if we're inside a git repo
  const isGitRepo = !!findUpSync(".git");

  // check whether we're in a typescript project
  const isTypeScriptProject = !!findUpSync("tsconfig.json");

  const pkgManager = detectPackageManager();

  let latestPartyKitVersion = "*";
  let latestPartySocketVersion = "*";
  if (packageVersion.startsWith("0.0.0-")) {
    // this means it's a beta, so let's use this version everywhere
    latestPartyKitVersion = packageVersion;
    latestPartySocketVersion = packageVersion;
  } else {
    try {
      latestPartyKitVersion = await fetch(
        `https://registry.npmjs.org/partykit/latest`
      )
        .then((res) => res.json() as Promise<{ version: string }>)
        .then((res) => res.version);

      latestPartySocketVersion = await fetch(
        `https://registry.npmjs.org/partysocket/latest`
      )
        .then((res) => res.json() as Promise<{ version: string }>)
        .then((res) => res.version);
    } catch (e) {
      logger.error(
        "Could not fetch latest versions of partykit and partysocket, defaulting to *"
      );
      logger.debug(e);
      latestPartyKitVersion = "*";
      latestPartySocketVersion = "*";
    }
  }

  if (packageJsonPath) {
    const packageJsonFile = fs.readFileSync(packageJsonPath, "utf8");
    const packageJsonIndent = detectIndent(packageJsonFile).indent || 2;
    const packageJson = JSON.parse(packageJsonFile);

    const shouldUseTypeScript =
      options.yes ??
      (await new Promise((resolve) => {
        if (isTypeScriptProject) {
          resolve(true);
          return;
        }
        function Component(props: {
          onSelect: (shouldUseTypeScript: boolean) => void;
        }) {
          return (
            <>
              <Box>
                <Text>Would you like to use TypeScript?</Text>
              </Box>
              <SelectInput
                items={[
                  { label: "Yes", value: true },
                  { label: "No", value: false }
                ]}
                onSelect={(item) => {
                  props.onSelect(item.value);
                }}
              />
            </>
          );
        }
        const { clear, unmount } = render(
          <Component
            onSelect={(shouldUseTypeScript: boolean) => {
              resolve(shouldUseTypeScript);
              clear();
              unmount();
            }}
          />
        );
      }));

    const alreadyInstalled =
      packageJson.devDependencies?.partykit ||
      packageJson.dependencies?.partykit;

    // if there's an existing package.json, we're in a project
    // ask the user whether they want to add to it, or create a new one
    const shouldAddToExisting =
      options.yes ??
      (await new Promise<boolean>((resolve, _reject) => {
        if (alreadyInstalled) {
          resolve(false);
          return;
        }
        function Component(props: { onSelect: (shouldAdd: boolean) => void }) {
          return (
            <>
              <Box>
                <Text>
                  Would you like to add PartyKit to{" "}
                  {chalk.bold(packageJsonPath)}?
                </Text>
              </Box>
              <SelectInput
                items={[
                  { label: "Add to package.json", value: true },
                  { label: "Create new project", value: false }
                ]}
                onSelect={(item) => {
                  props.onSelect(item.value);
                }}
              />
            </>
          );
        }
        const { clear, unmount } = render(
          <Component
            onSelect={(shouldAdd: boolean) => {
              resolve(shouldAdd);
              clear();
              unmount();
            }}
          />
        );
      }));

    if (shouldAddToExisting) {
      let shouldRunInstaller = false;
      if (!options.dryRun) {
        console.log(
          `‣ Adding to existing project at ${chalk.bold(packageJsonPath)}`
        );
        // we're adding to an existing project
        // so let's add the partykit dependency
        // and make a partykit.json file

        if (
          !packageJson.devDependencies?.partykit &&
          !packageJson.dependencies?.partykit
        ) {
          packageJson.devDependencies = packageJson.devDependencies || {};
          packageJson.devDependencies.partykit = latestPartyKitVersion;
          shouldRunInstaller = true;
        }

        packageJson.dependencies = packageJson.dependencies || {};
        if (!packageJson.dependencies.partysocket) {
          packageJson.dependencies.partysocket = latestPartySocketVersion;
          shouldRunInstaller = true;
        }

        // write the package.json back
        fs.writeFileSync(
          packageJsonPath,
          JSON.stringify(packageJson, null, packageJsonIndent) + "\n"
        );
      } else {
        console.log(
          `⤬ Dry run: Skipped adding dependencies to ${chalk.bold(
            packageJsonPath
          )}`
        );
      }

      if (!options.dryRun) {
        // make a partykit.json file

        const today = new Date();
        const defaultCompatibilityDate = `${today.getFullYear()}-${(
          today.getMonth() + 1
        )
          .toString()
          .padStart(2, "0")}-${today.getDate().toString().padStart(2, "0")}`;

        fs.writeFileSync(
          path.join(process.cwd(), "partykit.json"),
          JSON.stringify(
            {
              $schema: "https://www.partykit.io/schema.json",
              name:
                options.name ||
                `${(packageJson.name || "my")
                  .replace(
                    // replace non alphanumeric or -_ with -
                    /[^a-zA-Z0-9-_]/g,
                    "-"
                  )
                  .replace(
                    // remove leading -
                    /^-/,
                    ""
                  )}-party`,
              main: shouldUseTypeScript ? "party/index.ts" : "party/index.js",
              compatibilityDate: defaultCompatibilityDate
            },
            null,
            2
          ) + "\n"
        );
        console.log(`‣ Created ${chalk.bold("partykit.json")}`);
      } else {
        console.log(
          `⤬ Dry run: Skipped creating ${chalk.bold("partykit.json")}`
        );
      }

      if (!options.dryRun) {
        fs.mkdirSync(path.join(process.cwd(), "party"), { recursive: true });
      }

      // write an entrypoint file
      if (!options.dryRun) {
        if (shouldUseTypeScript) {
          fs.writeFileSync(
            path.join(process.cwd(), "party/index.ts"),
            fs.readFileSync(
              path.join(
                path.dirname(fileURLToPath(import.meta.url)),
                "..",
                "init",
                "index.ts"
              )
              .replace(/^.\\file:/, 'file:') // fix .\\ prefix on windows
            ) as unknown as string
          );
          console.log(`‣ Created ${chalk.bold("party/index.ts")}`);
        } else {
          fs.writeFileSync(
            path.join(process.cwd(), "party/index.js"),
            fs.readFileSync(
              path.join(
                path.dirname(fileURLToPath(import.meta.url)),
                "..",
                "init",
                "index.js"
              )
              .replace(/^.\\file:/, 'file:') // fix .\\ prefix on windows
            ) as unknown as string
          );
          console.log(`‣ Created ${chalk.bold("party/index.js")}`);
        }
      } else {
        console.log(
          `⤬ Dry run: Skipped creating ${chalk.bold(
            shouldUseTypeScript ? "party/index.ts" : "party/index.js"
          )}`
        );
      }

      // install the dependencies
      if (shouldRunInstaller) {
        if (!options.dryRun) {
          await installWithPackageManager({
            pkgManager: pkgManager?.name || "npm",
            cwd: path.dirname(packageJsonPath)
          });
          console.log(
            "‣ Installed dependencies with " +
              chalk.bold(pkgManager?.name || "npm")
          );
        } else {
          console.log(
            `⤬ Dry run: Skipped installing dependencies with ${chalk.bold(
              pkgManager?.name || "npm"
            )}`
          );
        }
      }
    } else {
      // we're making a new project altogether
      // so let's call the `npm create partykit` on the shell

      const partyKitProjectName =
        options.name ||
        `${(packageJson.name || "my")
          .replace(
            // replace non alphanumeric or -_ with -
            /[^a-zA-Z0-9-_]/g,
            "-"
          )
          .replace(
            // remove leading -
            /^-/,
            ""
          )}-party`;

      const command = `${
        pkgManager?.name || "npm"
      } create partykit@latest ${partyKitProjectName} -- ${
        shouldUseTypeScript ? "--template typescript" : ""
      } ${isGitRepo ? "" : "--git"} --install -y ${
        options.dryRun ? "--dry-run" : ""
      }`;

      execaCommandSync(command, {
        shell: true,
        // we keep these two as "inherit" so that
        // logs are still visible.
        stdout: "inherit",
        stderr: "inherit"
      });
    }
  } else {
    // we're making a new project altogether
    // so let's call the `npm create partykit` on the shell
    const command = `${
      pkgManager?.name || "npm"
    } create partykit@latest my-party ${
      isTypeScriptProject ? "--typescript" : ""
    } ${isGitRepo ? "" : "--git"} --install -y ${
      options.dryRun ? "--dry-run" : ""
    }`;

    execaCommandSync(command, {
      shell: true,
      // we keep these two as "inherit" so that
      // logs are still visible.
      stdout: "inherit",
      stderr: "inherit"
    });
  }
}

const esbuildOptions: BuildOptions = {
  format: "esm",
  bundle: true,
  write: false,
  target: "esnext"
} as const;

export async function deploy(options: {
  main: string | undefined;
  name: string;
  config: string | undefined;
  serve: string | undefined;
  vars: Record<string, string> | undefined;
  define: Record<string, string> | undefined;
  preview: string | undefined;
  withEnv: boolean | undefined;
  withVars: boolean | undefined;
  compatibilityDate: string | undefined;
  compatibilityFlags: string[] | undefined;
  tailConsumers: string[] | undefined;
  minify: boolean | undefined;
  domain: string | undefined;
}): Promise<void> {
  const config = getConfig(
    options.config,
    {
      main: options.main,
      name: options.name,
      serve: options.serve,
      vars: options.vars,
      define: options.define,
      compatibilityDate: options.compatibilityDate,
      compatibilityFlags: options.compatibilityFlags,
      domain: options.domain
    },
    { withEnv: options.withEnv }
  );

  if (!config.main) {
    throw new ConfigurationError(MissingEntryPointError);
  }

  if (!config.name) {
    throw new ConfigurationError(MissingProjectNameError);
  }

  if (config.build?.command) {
    const buildCommand = config.build.command;
    const buildCwd = config.build.cwd;
    // run a build

    await execaCommand(buildCommand, {
      shell: true,
      // we keep these two as "inherit" so that
      // logs are still visible.
      stdout: "inherit",
      stderr: "inherit",
      ...(buildCwd && { cwd: buildCwd })
    });
  }

  if (!fs.existsSync(config.main)) {
    throw new Error(`Could not find main: ${config.main}`);
  }

  const absoluteScriptPath = path.join(process.cwd(), config.main).replace(
    /\\/g, // windows
    "/"
  );

  // get user details
  const user = await getUser();  

  if (
    config.domain &&
    !(process.env.CLOUDFLARE_ACCOUNT_ID && process.env.CLOUDFLARE_API_TOKEN)
  ) {
    throw new Error(
      "You must set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN to use the domain option"
    );
  }
  const domain =
    // eslint-disable-next-line deprecation/deprecation
    config.domain || `${config.name}.${config.team || user.login}.partykit.dev`;

  const assetsConfig =
    config.serve === undefined
      ? {}
      : typeof config.serve === "string"
        ? { path: config.serve }
        : config.serve;

  const newAssetsMap: StaticAssetsManifestType = {
    devServer: "", // this is a no-op when deploying
    browserTTL: assetsConfig.browserTTL,
    edgeTTL: assetsConfig.edgeTTL,
    singlePageApp: assetsConfig.singlePageApp,
    assets: {},
    assetInfo: {}
  };

  const assetsBuild =
    typeof assetsConfig.build === "string"
      ? { entry: assetsConfig.build }
      : assetsConfig.build;

  const assetsPath = assetsConfig.path;

  const esbuildAssetOptions: BuildOptions = {
    entryPoints:
      typeof assetsBuild?.entry === "string"
        ? [assetsBuild.entry]
        : assetsBuild?.entry,
    outdir:
      assetsBuild?.outdir ||
      (assetsPath ? path.join(assetsPath, "dist") : undefined),
    bundle: assetsBuild?.bundle ?? true,
    splitting: assetsBuild?.splitting ?? true,
    minify: assetsBuild?.minify ?? true,
    format: assetsBuild?.format ?? "esm",
    sourcemap: assetsBuild?.sourcemap ?? true,
    external: assetsBuild?.external,
    alias: assetsBuild?.alias,
    define: {
      PARTYKIT_HOST: `"${
        options.preview ? `${options.preview}.` : ""
      }${domain}"`,
      ...config.define,
      ...assetsBuild?.define
    },
    loader: assetsBuild?.loader
  };

  const unsupportedKeys = (["include", "exclude"] as const).filter(
    (key) => assetsConfig[key] !== undefined
  );
  if (unsupportedKeys.length > 0) {
    throw new Error(
      `Not implemented keys in config.serve: ${unsupportedKeys.join(", ")}`
    );
  }

  const esbuild = await import("esbuild");

  const assetsApiParams = options?.preview
    ? `?${new URLSearchParams({
        preview: options.preview,
        // notify that the client has attempted to call prepare_assets,
        // so that each upload process doesn't need to do it
        prepare: "true"
      })}`
    : "";

  // eslint-disable-next-line deprecation/deprecation
  const assetsApiPath = `/parties/${config.team || user.login}/${
    config.name
  }/assets${assetsApiParams}`;
  // eslint-disable-next-line deprecation/deprecation
  const prepareAssetsApiPath = `/parties/${config.team || user.login}/${
    config.name
  }/prepare_assets${assetsApiParams}`;

  const filesToUpload: {
    file: string;
    filePath: string;
    fileName: string;
  }[] = [];

  // prepare static assets to be uploaded

  if (assetsPath) {
    // do a build
    esbuild.buildSync(esbuildAssetOptions);

    // get current assetsMap
    const currentAssetsMap = await fetchResult<{
      assets: Record<string, string>;
    }>(assetsApiPath, {
      user,
      headers: {
        "Content-Type": "application/json"
      }
    });

    for (const file of findAllFiles(assetsPath)) {
      const filePath = path.join(assetsPath, file);

      // throw an error if it's bigger than 10mb

      const fileSize = fs.statSync(filePath).size;
      const fileHash = crypto
        .createHash("sha1")
        .update(fs.readFileSync(filePath) as unknown as string)
        .digest("hex");

      const sourceName = `${path.basename(
        file,
        path.extname(file)
      )}${path.extname(file)}`;

      const fileName = `${path.basename(
        file,
        path.extname(file)
      )}-${fileHash}${path.extname(file)}`;

      if (fileSize > 20 * 1024 * 1024) {
        throw new Error(
          `Asset ${file} is larger than 20mb, please reduce its size`
        );
      }

      const key = file.replace(
        /\\/g, // windows
        "/"
      );

      newAssetsMap.assets[key] = fileName;
      newAssetsMap.assetInfo![key] = {
        fileHash,
        fileSize,
        fileName: sourceName
      };

      // if the file is already uploaded, skip it
      if (
        currentAssetsMap.assets[
          file.replace(
            /\\/g, // windows
            "/"
          )
        ] !== fileName
      ) {
        filesToUpload.push({
          file,
          filePath,
          fileName
        });
      }
    }
  }

  // before starting upload, let's build the source files (fail fast)

  const wasmModules: Record<string, Buffer> = {};
  const binModules: Record<string, Buffer> = {};

  const code = (
    await esbuild.build({
      stdin: {
        contents: `
          import WorkerSpec from '${absoluteScriptPath}'; export default WorkerSpec;
          ${Object.entries(config.parties || {})
            .map(
              ([name, party]) =>
                `
import ${name}Party from '${party}'; 
export const ${name} = ${name}Party;
`
            )
            .join("\n")}
        `,

        resolveDir: process.cwd()
        // TODO: setting a sourcefile name crashes the whole thing???
        // sourcefile: "./" + path.relative(process.cwd(), scriptPath),
      },
      ...esbuildOptions,
      conditions: ["partykit", "workerd", "worker"],
      minify: options.minify,
      define: {
        PARTYKIT_HOST: `"${
          options.preview ? `${options.preview}.` : ""
        }${domain}"`,
        ...esbuildOptions.define,
        ...config.define
      },
      inject: [
        fileURLToPath(
          path.join(path.dirname(import.meta.url), "../inject-process.js")
          .replace(/^.\\file:/, 'file:') // fix .\\ prefix on windows
        )
      ],
      alias: config.build?.alias,
      plugins: [
        nodejsCompatPlugin,
        {
          name: "partykit-wasm-publish",
          setup(build) {
            build.onResolve({ filter: /\.wasm(\?module)?$/ }, (args) => {
              const filePath = path.join(
                args.resolveDir,
                args.path.replace(/\?module$/, "")
              );
              const fileContent = fs.readFileSync(filePath);
              const fileHash = crypto
                .createHash("sha1")
                .update(fileContent as unknown as string)
                .digest("hex");
              const fileName = `./${fileHash}-${path
                .basename(args.path)
                .replace(/\?module$/, "")}`;

              wasmModules[fileName] = fs.readFileSync(filePath);

              return {
                path: fileName, // change the reference to the changed module
                external: true, // mark it as external in the bundle
                namespace: "partykit-module-wasm-publish" // just a tag, this isn't strictly necessary
              };
            });
          }
        },
        {
          name: "partykit-bin-publish",
          setup(build) {
            build.onResolve({ filter: /\.bin$/ }, (args) => {
              const filePath = path.join(
                args.resolveDir,
                args.path.replace(/\?module$/, "")
              );
              const fileContent = fs.readFileSync(filePath);
              const fileHash = crypto
                .createHash("sha1")
                .update(fileContent as unknown as string)
                .digest("hex");
              const fileName = `./${fileHash}-${path
                .basename(args.path)
                .replace(/\?module$/, "")}`;

              binModules[fileName] = fs.readFileSync(filePath);

              return {
                path: fileName, // change the reference to the changed module
                external: true, // mark it as external in the bundle
                namespace: "partykit-module-bin-publish" // just a tag, this isn't strictly necessary
              };
            });
          }
        }
      ]
    })
  ).outputFiles![0].text;

  // starting upload. first, uploading assets...

  if (filesToUpload.length > 0) {
    logger.log(
      `Preparing ${filesToUpload.length} asset${
        filesToUpload.length > 1 ? "s" : ""
      } for upload...`
    );

    // preflight to make sure we're good to receive the assets
    await fetchResult(prepareAssetsApiPath, {
      method: "POST",
      body: JSON.stringify(newAssetsMap),
      user
    });

    logger.log(
      `Uploading ${filesToUpload.length} asset${
        filesToUpload.length > 1 ? "s" : ""
      }...`
    );

    const withConcurrencyLimits = limit(20);
    const withRetries = (fn: () => Promise<void>) =>
      retry(fn, {
        maxRetryTime: 10_000,
        retries: 2
      });

    await Promise.all(
      filesToUpload.map((file) =>
        withConcurrencyLimits(() =>
          withRetries(() =>
            fetchResult(assetsApiPath, {
              user,
              method: "PUT",
              body: fs.createReadStream(file.filePath),
              headers: {
                ContentType: "application/octet-stream",
                "X-PartyKit-Asset-Name": file.fileName
              },
              duplex: "half"
            }).then(() => {
              logger.log(
                `Uploaded ${file.file.replace(
                  /\\/g, // windows
                  "/"
                )}`
              );
            })
          )
        )
      )
    );

    logger.log(`Updating asset index...`);

    await fetchResult(assetsApiPath, {
      user,
      method: "POST",
      body: JSON.stringify(newAssetsMap),
      headers: {
        "Content-Type": "application/json"
      }
    });
  }

  // then, prepare the deploy request

  const form = new FormData();
  form.set("code", code);

  const vars = options.withVars
    ? config.vars
    : // only set vars passed in via cli with --var,
      // not from .env/partykit.json/etc
      options.vars;
  if (vars && Object.keys(vars).length > 0) {
    // TODO: need some good messaging here to explain what's going on
    form.set("vars", JSON.stringify(vars));
  }
  if (config.parties) {
    form.set("parties", JSON.stringify([...Object.keys(config.parties)]));
  }
  if (config.ai) {
    form.set("ai", JSON.stringify(config.ai));
  }

  if (config.domain) {
    form.set("domain", config.domain);
  }

  if (config.vectorize) {
    form.set("vectorize", JSON.stringify(config.vectorize));
  }

  if (config.crons) {
    form.set("crons", JSON.stringify(config.crons));
  }

  if (config.logpush) {
    // make sure we're deploying to self hosted
    if (
      !(process.env.CLOUDFLARE_ACCOUNT_ID && process.env.CLOUDFLARE_API_TOKEN)
    ) {
      throw new Error(
        "You must set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN to use the logpush option"
      );
    }
    form.set("logpush", JSON.stringify(config.logpush));
  }

  if (
    config.tailConsumers ||
    (options.tailConsumers && options.tailConsumers.length > 0)
  ) {
    // make sure we're deploying to self hosted
    if (
      !(process.env.CLOUDFLARE_ACCOUNT_ID && process.env.CLOUDFLARE_API_TOKEN)
    ) {
      throw new Error(
        "You must set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN to use the tailConsumers option"
      );
    }
    form.set(
      "tailConsumers",
      JSON.stringify(options.tailConsumers || config.tailConsumers)
    );
  }

  if (config.analytics) {
    // make sure we're deploying to self hosted
    if (
      !(process.env.CLOUDFLARE_ACCOUNT_ID && process.env.CLOUDFLARE_API_TOKEN)
    ) {
      throw new Error(
        "You must set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN to use the analytics option"
      );
    }
    form.set("analytics", config.analytics);
  }

  if (config.bindings) {
    form.set("bindings", JSON.stringify(config.bindings));
  }

  if (config.placement) {
    form.set("placement", JSON.stringify(config.placement));
  }

  if (config.observability) {
    form.set("observability", JSON.stringify(config.observability));
  }

  if (assetsPath) {
    form.set("staticAssetsManifest", JSON.stringify(newAssetsMap));
  }

  for (const [fileName, buffer] of Object.entries(wasmModules)) {
    const uploadFileName = path.join("upload", fileName).replace(/\\/g, "/");
    form.set(
      uploadFileName,
      new File([buffer as unknown as string], uploadFileName, {
        type: "application/wasm"
      })
    );
  }

  for (const [fileName, buffer] of Object.entries(binModules)) {
    const uploadFileName = path.join("upload", fileName).replace(/\\/g, "/");
    form.set(
      uploadFileName,
      new File([buffer as unknown as string], uploadFileName, { type: "application/octet-stream" })
    );
  }

  // init node modules
  for (const nodeModuleName of baseNodeBuiltins) {
    form.set(
      `upload/partykit-exposed-node-${nodeModuleName}`,
      new File(
        [
          `export * from 'node:${nodeModuleName}';export { default } from 'node:${nodeModuleName}';`
        ],
        `upload/partykit-exposed-node-${nodeModuleName}`,
        { type: "application/javascript+module" }
      )
    );
  }

  // initialise cloudflare specific modules
  for (const cfModuleName of ["email", "sockets"]) {
    form.set(
      `upload/partykit-exposed-cloudflare-${cfModuleName}`,
      new File(
        [`export * from 'cloudflare:${cfModuleName}';`],
        `upload/partykit-exposed-cloudflare-${cfModuleName}`,
        { type: "application/javascript+module" }
      )
    );
  }

  if (config.compatibilityDate) {
    form.set("compatibilityDate", config.compatibilityDate);
  } else {
    const currentUTCDate = new Date().toISOString().split("T", 1)[0];

    logger.warn(
      `No compatibilityDate specified in configuration, defaulting to ${currentUTCDate}
You can silence this warning by adding this to your partykit.json file: 
  "compatibilityDate": "${currentUTCDate}"
or by passing it in via the CLI
  --compatibility-date ${currentUTCDate}
`
    );
  }
  if (config.compatibilityFlags) {
    form.set("compatibilityFlags", JSON.stringify(config.compatibilityFlags));
  }

  const urlSearchParams = new URLSearchParams();
  if (options.preview) {
    urlSearchParams.set("preview", options.preview);
  }

  // finally, deploy the code

  console.log("Deploying...");

  const deployRes = await fetchResult<{
    result: { is_initial_deploy: boolean };
  }>(
    // eslint-disable-next-line deprecation/deprecation
    `/parties/${config.team || user.login}/${config.name}${
      options.preview ? `?${urlSearchParams.toString()}` : ""
    }`,
    {
      user,
      method: "POST",
      body: form
    }
  );

  logger.log(
    `Deployed ${config.main} to https://${`${
      options.preview ? `${options.preview}.` : ""
    }${domain}`}`
  );
  if (deployRes.result.is_initial_deploy) {
    logger.log(
      `We're provisioning the ${
        options.preview ? `${options.preview}.` : ""
      }${domain} domain. This can take up to ${chalk.bold(
        "2 minutes"
      )}. Hold tight!`
    );
  }
}

export async function info(options: {
  name: string | undefined;
  config: string | undefined;
  preview: string | undefined;
}) {
  const config = getConfig(options.config, {
    name: options.name
  });
  if (!config.name) {
    throw new ConfigurationError(MissingProjectNameError);
  }

  // get user details
  const user = await getUser();

  const urlSearchParams = new URLSearchParams();
  if (options.preview) {
    urlSearchParams.set("preview", options.preview);
  }

  const res = await fetchResult(
    // eslint-disable-next-line deprecation/deprecation
    `/parties/${config.team || user.login}/${config.name}${
      options.preview ? `?${urlSearchParams.toString()}` : ""
    }`,
    { user }
  );

  console.log(res);
}

export async function _delete(rawOptions: {
  name: string | undefined;
  force: boolean | undefined;
  config: string | undefined;
  preview: string | undefined;
}) {
  const { force, ...options } = rawOptions;
  const config = getConfig(options.config, options);
  if (!config.name) {
    throw new ConfigurationError(MissingProjectNameError);
  }
  // get user details
  const user = await getUser();

  if (
    config.domain &&
    !(process.env.CLOUDFLARE_ACCOUNT_ID && process.env.CLOUDFLARE_API_TOKEN)
  ) {
    throw new Error(
      "You must set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN to use the domain option"
    );
  }
  const domain =
    // eslint-disable-next-line deprecation/deprecation
    config.domain || `${config.name}.${config.team || user.login}.partykit.dev`;

  const urlSearchParams = new URLSearchParams();
  if (options.preview) {
    urlSearchParams.set("preview", options.preview);
  }

  if (!process.stdin.isTTY && !force) {
    throw new Error(
      "Cannot delete without --force when running in non-interactive mode"
    );
  }

  const shouldDelete =
    force ??
    (await new Promise<boolean>((resolve, _reject) => {
      function Component(props: { onSelect: (shouldDelete: boolean) => void }) {
        return (
          <>
            <Box>
              <Text>
                Are you sure you want to delete{" "}
                {chalk.bold(
                  options.preview ? `${options.preview}.${domain}` : `${domain}`
                )}
                ?
              </Text>
            </Box>
            <SelectInput
              items={[
                { label: "Yes", value: true },
                { label: "No", value: false }
              ]}
              onSelect={(item) => {
                props.onSelect(item.value);
              }}
            />
          </>
        );
      }
      const { clear, unmount } = render(
        <Component
          onSelect={(shouldDelete: boolean) => {
            resolve(shouldDelete);
            clear();
            unmount();
          }}
        />
      );
    }));

  if (!shouldDelete) {
    logger.log("Aborted");
    return;
  }

  await fetchResult(
    // eslint-disable-next-line deprecation/deprecation
    `/parties/${config.team || user.login}/${config.name}${
      options.preview ? `?${urlSearchParams.toString()}` : ""
    }`,
    {
      user,
      method: "DELETE"
    }
  );

  const displayName = options.preview
    ? `${options.preview}.${domain}`
    : `${domain}`;

  logger.log(`Deleted ${chalk.bold(displayName)}`);
}

type TailCreationApiResponse = {
  result: {
    id: string;
    url: string;
    expires_at: Date;
  };
};

const TRACE_VERSION = "trace-v1";

export async function tail(options: {
  name: string | undefined;
  config: string | undefined;
  preview: string | undefined;
  status: ("ok" | "canceled" | "error")[];
  ip: string[] | undefined;
  header: string | undefined;
  samplingRate: number | undefined;
  method: string[] | undefined;
  format: "json" | "pretty";
  search: string | undefined;
  debug: boolean;
}) {
  // get user details
  const user = await getUser();

  const config = getConfig(options.config, {
    name: options.name
  });
  if (!config.name) {
    throw new ConfigurationError(MissingProjectNameError);
  }

  let scriptDisplayName = config.name;
  if (options.preview) {
    scriptDisplayName = `${scriptDisplayName} (preview: ${options.preview})`;
  }

  const filters: TailFilterMessage = translateCLICommandToFilterMessage({
    status: options.status,
    header: options.header,
    method: options.method,
    search: options.search,
    samplingRate: options.samplingRate,
    clientIp: options.ip
  });

  const urlSearchParams = new URLSearchParams();
  if (options.preview) {
    urlSearchParams.set("preview", options.preview);
  }
  const {
    result: { id: tailId, url: websocketUrl, expires_at: expiration }
  } = await fetchResult<TailCreationApiResponse>(
    // eslint-disable-next-line deprecation/deprecation
    `/parties/${config.team || user.login}/${config.name}/tail${
      options.preview ? `?${urlSearchParams.toString()}` : ""
    }`,
    {
      user,
      method: "POST",
      body: JSON.stringify(filters)
    }
  );

  if (options.format === "pretty") {
    logger.log(
      `Successfully created tail, expires at ${expiration.toLocaleString()}`
    );
  }

  async function deleteTail() {
    await fetchResult(
      // eslint-disable-next-line deprecation/deprecation
      `/parties/${config.team || user.login}/${config.name}/tail/${tailId}${
        options.preview ? `?${urlSearchParams.toString()}` : ""
      }`,
      {
        user,
        method: "DELETE"
      }
    );
  }

  // connect to the tail
  const tailSocket = new WebSocket(websocketUrl, TRACE_VERSION, {
    headers: {
      "Sec-WebSocket-Protocol": TRACE_VERSION, // needs to be `trace-v1` to be accepted
      "User-Agent": `partykit/${packageVersion}`,
      "X-PartyKit-Version": packageVersion
    }
  });

  // send filters when we open up
  tailSocket.on("open", function () {
    tailSocket.send(
      JSON.stringify({ debug: options.debug || false }),
      { binary: false, compress: false, mask: false, fin: true },
      (err) => {
        if (err) {
          throw err;
        }
      }
    );
  });

  onExit(() => {
    tailSocket.terminate();
    deleteTail().catch((err) => {
      logger.error(`Failed to delete tail: ${err.message}`);
    });
  });

  const printLog: (data: RawData) => void =
    options.format === "pretty" ? prettyPrintLogs : jsonPrintLogs;

  tailSocket.on("message", printLog);

  while (tailSocket.readyState !== tailSocket.OPEN) {
    switch (tailSocket.readyState) {
      case tailSocket.CONNECTING:
        await sleep(100);
        break;
      case tailSocket.CLOSING:
        await sleep(100);
        break;
      case tailSocket.CLOSED:
        throw new Error(
          `Connection to ${scriptDisplayName} closed unexpectedly.`
        );
    }
  }

  if (options.format === "pretty") {
    logger.info(
      `Connected to ${chalk.bold(scriptDisplayName)}, waiting for logs...`
    );
  }

  tailSocket.on("close", async () => {
    tailSocket.terminate();
    await deleteTail();
  });
}

export async function list(options: {
  config: string | undefined;
  format: "json" | "pretty";
}) {
  // get user details
  const user = await getUser();

  const config = getConfig(options.config);

  const res = await fetchResult<{ name: string; url: string }[]>(
    // eslint-disable-next-line deprecation/deprecation
    `/parties/${config.team || user.login}`,
    { user }
  );

  if (options.format === "json") {
    console.log(JSON.stringify(res, null, 2));
  } else {
    render(<InkTable data={res} />);
  }
}

export async function generateToken() {
  logger.log("Opening web browser to authenticate you...");
  logger.log("");
  const session = await createClerkServiceTokenSession();

  // Using console directly instead of ink because ink inserts line breaks
  // into text and makes it harder to copy the generated token
  logger.log(
    "Set the following environment variables to allow a machine to deploy to PartyKit on your behalf:"
  );
  logger.log("");
  // eslint-disable-next-line deprecation/deprecation
  logger.log(`PARTYKIT_LOGIN=${chalk.bold(session.login)}`);
  logger.log(`PARTYKIT_TOKEN=${chalk.bold(session.access_token)}`);
  logger.log("");
  logger.log("Store the token securely, it will not be shown again.");
}

export async function whoami() {
  // get user details
  try {
    const user = getUserConfig();
    // eslint-disable-next-line deprecation/deprecation
    console.log(`Logged in as ${chalk.bold(user.login)} (${user.type})`);
  } catch (e) {
    console.log(
      `Not logged in, run ${chalk.bold(
        "npx partykit login"
      )} to get user details`
    );
  }
}

export const env = {
  async list(options: {
    name: string | undefined;
    config: string | undefined;
    preview: string | undefined;
  }) {
    // get user details
    const user = await getUser();

    const config = getConfig(options.config, {
      name: options.name
    });
    if (!config.name) {
      throw new ConfigurationError(MissingProjectNameError);
    }

    const urlSearchParams = new URLSearchParams();
    urlSearchParams.set("keys", "true");
    if (options.preview) {
      urlSearchParams.set("preview", options.preview);
    }

    const res = await fetchResult<string[]>(
      // eslint-disable-next-line deprecation/deprecation
      `/parties/${config.team || user.login}/${
        config.name
      }/env?${urlSearchParams.toString()}`,
      { user }
    );

    console.log(`Deployed variables: ${res.join(", ")}`);
  },
  async pull(
    fileName: string | undefined,
    options: {
      name: string | undefined;
      config: string | undefined;
      preview: string | undefined;
    }
  ) {
    // get user details
    const user = await getUser();

    const config = getConfig(options.config, {
      name: options.name
    });
    if (!config.name) {
      throw new ConfigurationError(MissingProjectNameError);
    }

    const urlSearchParams = new URLSearchParams();
    if (options.preview) {
      urlSearchParams.set("preview", options.preview);
    }

    const res = await fetchResult(
      // eslint-disable-next-line deprecation/deprecation
      `/parties/${config.team || user.login}/${config.name}/env${
        options.preview ? `?${urlSearchParams.toString()}` : ""
      }`,
      { user }
    );

    const targetFileName =
      fileName || options.config || getConfigPath() || "partykit.json";
    if (!fs.existsSync(targetFileName)) {
      logger.log(`Creating ${targetFileName}...`);
      fs.writeFileSync(targetFileName, "{}");
    } else {
      logger.log(`Updating ${targetFileName}...`);
    }

    fs.writeFileSync(
      targetFileName,
      JSON.stringify(
        {
          $schema: "https://www.partykit.io/schema.json",
          ...JSON.parse(fs.readFileSync(targetFileName, "utf8")),
          name: config.name,
          vars: res
        },
        null,
        2
      ) + "\n"
    );
  },
  async push(options: {
    name: string | undefined;
    config: string | undefined;
    preview: string | undefined;
  }) {
    // get user details
    const user = await getUser();

    const config = getConfig(options.config, {
      name: options.name
    });
    if (!config.name) {
      throw new ConfigurationError(MissingProjectNameError);
    }

    const urlSearchParams = new URLSearchParams();
    if (options.preview) {
      urlSearchParams.set("preview", options.preview);
    }

    if (Object.keys(config.vars || {}).length === 0) {
      logger.warn("No environment variables to push, exiting...");
      return;
    }

    await fetchResult(
      // eslint-disable-next-line deprecation/deprecation
      `/parties/${config.team || user.login}/${config.name}/env${
        options.preview ? `?${urlSearchParams.toString()}` : ""
      }`,
      {
        user,
        method: "POST",
        body: JSON.stringify(config.vars || {}),
        headers: {
          "Content-Type": "application/json"
        }
      }
    );

    logger.log(
      "Pushed environment variables:",
      Object.keys(config.vars || {}).join(", ")
    );
  },
  async add(
    key: string,
    options: {
      name: string | undefined;
      config: string | undefined;
      preview: string | undefined;
    }
  ) {
    // get user details
    const user = await getUser();

    const config = getConfig(options.config, {
      name: options.name
    });
    if (!config.name) {
      throw new ConfigurationError(MissingProjectNameError);
    }

    const { default: prompt } = await import("prompts");

    const { value } = !process.stdin.isTTY
      ? // the value is being piped in
        await new Promise<{ value: string }>((resolve, reject) => {
          const stdin = process.stdin;

          let data = "";

          stdin.on("data", function (chunk) {
            data += chunk;
          });

          stdin.on("end", function () {
            resolve({ value: data });
          });

          stdin.on("error", function (err) {
            reject(err);
          });
        })
      : // the value is being entered manually
        await prompt({
          type: "password",
          name: "value",
          message: `Enter the value for ${key}`
        });

    const urlSearchParams = new URLSearchParams();
    if (options.preview) {
      urlSearchParams.set("preview", options.preview);
    }

    await fetchResult(
      // eslint-disable-next-line deprecation/deprecation
      `/parties/${config.team || user.login}/${config.name}/env/${key}${
        options.preview ? `?${urlSearchParams.toString()}` : ""
      }`,
      {
        user,
        method: "POST",
        body: value
      }
    );

    logger.log(`Deployed environment variable: ${key}`);
  },
  async remove(
    key: string | undefined,
    options: {
      name: string | undefined;
      config: string | undefined;
      preview: string | undefined;
    }
  ) {
    // get user details
    const user = await getUser();

    const config = getConfig(options.config, {
      name: options.name
    });
    if (!config.name) {
      throw new ConfigurationError(MissingProjectNameError);
    }

    const urlSearchParams = new URLSearchParams();
    if (options.preview) {
      urlSearchParams.set("preview", options.preview);
    }

    if (!key) {
      const { default: prompt } = await import("prompts");

      const { value } = await prompt({
        type: "confirm",
        name: "value",
        message: `Are you sure you want to delete all environment variables?`,
        initial: true
      });

      if (!value) {
        console.log("Aborted");
        return;
      } else {
        await fetchResult(
          // eslint-disable-next-line deprecation/deprecation
          `/parties/${config.team || user.login}/${config.name}/env${
            options.preview ? `?${urlSearchParams.toString()}` : ""
          }`,
          {
            user,
            method: "DELETE"
          }
        );
        logger.log(`Deleted all deployed environment variables`);
        return;
      }
    }

    await fetchResult(
      // eslint-disable-next-line deprecation/deprecation
      `/parties/${config.team || user.login}/${config.name}/env/${key}${
        options.preview ? `?${urlSearchParams.toString()}` : ""
      }`,
      {
        user,
        method: "DELETE"
      }
    );

    logger.log(`Deleted deployed environment variable: ${key}`);
  }
};
