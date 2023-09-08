import path from "path";
import * as fs from "fs";
import { fetchResult } from "./fetchResult";
import { File, FormData } from "undici";
import type { BuildOptions } from "esbuild";
import * as crypto from "crypto";
import WebSocket from "ws";
import type { RawData } from "ws";
import { onExit } from "signal-exit";

import InkTable from "./ink-table";
import SelectInput from "ink-select-input";

import { Dev } from "./dev";
import type { DevProps } from "./dev";

export { Dev };
export type { DevProps };

import { execaCommand, execaCommandSync } from "execa";
import { version as packageVersion } from "../package.json";

import {
  createClerkServiceTokenSession,
  getConfig,
  getConfigPath,
  getUser,
  getUserConfig,
} from "./config";
import detectPackageManager from "which-pm-runs";

import type { TailFilterMessage } from "./tail/filters";
import { translateCLICommandToFilterMessage } from "./tail/filters";
import { jsonPrintLogs, prettyPrintLogs } from "./tail/printing";
import { Box, Text, render } from "ink";
import React from "react";
import chalk from "chalk";
import { ConfigurationError, logger } from "./logger";
import type { StaticAssetsManifestType } from "./server";
import { findUpSync } from "find-up";
import { fileURLToPath } from "url";
import nodejsCompatPlugin from "./nodejs-compat";

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
        yield path.relative(root, filePath);
      }
    }
  }
}

async function installWithPackageManager({
  pkgManager,
  cwd,
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
      stdio: "inherit",
    }
  );
}

function ensureYarnLock({ cwd }: { cwd: string }) {
  const yarnLock = findUpSync("yarn.lock", { cwd });
  if (yarnLock) return;
  return fs.writeFileSync(path.join(cwd, "yarn.lock"), "", {
    encoding: "utf-8",
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
        .then((res) => res.json())
        .then((res) => res.version as string);

      latestPartySocketVersion = await fetch(
        `https://registry.npmjs.org/partysocket/latest`
      )
        .then((res) => res.json())
        .then((res) => res.version as string);
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
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
    // if there's an existing package.json, we're in a project
    // ask the user whether they want to add to it, or create a new one
    const shouldAddToExisting =
      options.yes ??
      (await new Promise<boolean>((resolve, _reject) => {
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
                  { label: "Create new project", value: false },
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

        if (!packageJson.devDependencies?.partykit) {
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
          JSON.stringify(packageJson, null, 2) + "\n"
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
        fs.writeFileSync(
          path.join(process.cwd(), "partykit.json"),
          JSON.stringify(
            {
              name: options.name || `${packageJson.name || "my"}-party`,
              main: isTypeScriptProject ? "party/index.ts" : "party/index.js",
            },
            null,
            2
          )
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
        if (isTypeScriptProject) {
          fs.writeFileSync(
            path.join(process.cwd(), "party/index.ts"),
            fs.readFileSync(
              path.join(
                path.dirname(fileURLToPath(import.meta.url)),
                "..",
                "init",
                "index.ts"
              )
            )
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
            )
          );
          console.log(`‣ Created ${chalk.bold("party/index.js")}`);
        }
      } else {
        console.log(
          `⤬ Dry run: Skipped creating ${chalk.bold(
            isTypeScriptProject ? "party/index.ts" : "party/index.js"
          )}`
        );
      }

      // install the dependencies
      if (shouldRunInstaller) {
        if (!options.dryRun) {
          await installWithPackageManager({
            pkgManager: pkgManager?.name || "npm",
            cwd: path.dirname(packageJsonPath),
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
        options.name || `${packageJson.name || "my"}-party`;

      const command = `${
        pkgManager?.name || "npm"
      } create partykit@latest ${partyKitProjectName} -- ${
        isTypeScriptProject ? "--typescript" : ""
      } ${isGitRepo ? "" : "--git"} --install -y ${
        options.dryRun ? "--dry-run" : ""
      }`;

      execaCommandSync(command, {
        shell: true,
        // we keep these two as "inherit" so that
        // logs are still visible.
        stdout: "inherit",
        stderr: "inherit",
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
      stderr: "inherit",
    });
  }
}

const esbuildOptions: BuildOptions = {
  format: "esm",
  bundle: true,
  write: false,
  target: "esnext",
} as const;

export async function deploy(options: {
  main: string | undefined;
  name: string;
  config: string | undefined;
  serve: string | undefined;
  vars: Record<string, string> | undefined;
  define: Record<string, string> | undefined;
  preview: string | undefined;
  withVars: boolean | undefined;
  compatibilityDate: string | undefined;
  compatibilityFlags: string[] | undefined;
  minify: boolean | undefined;
}): Promise<void> {
  const config = getConfig(options.config, {
    main: options.main,
    name: options.name,
    serve: options.serve,
    vars: options.vars,
    define: options.define,
    compatibilityDate: options.compatibilityDate,
    compatibilityFlags: options.compatibilityFlags,
  });

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
      ...(buildCwd && { cwd: buildCwd }),
    });
  }

  const absoluteScriptPath = path.join(process.cwd(), config.main).replace(
    /\\/g, // windows
    "/"
  );

  // get user details
  const user = await getUser();

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
    define: {
      PARTYKIT_HOST: `"${config.name}.${user.login}.partykit.dev"`,
      ...config.define,
      ...assetsBuild?.define,
    },
    loader: assetsBuild?.loader,
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

  if (assetsPath) {
    // do a build
    esbuild.buildSync(esbuildAssetOptions);

    // get current assetsMap
    const currentAssetsMap = await fetchResult<{
      assets: Record<string, string>;
    }>(`/parties/${user.login}/${config.name}/assets`, {
      user,
      headers: {
        "Content-Type": "application/json",
      },
    });

    const filesToUpload: {
      file: string;
      filePath: string;
      fileName: string;
    }[] = [];

    for (const file of findAllFiles(assetsPath)) {
      const filePath = path.join(assetsPath, file);

      // throw an error if it's bigger than 10mb

      if (fs.statSync(filePath).size > 20 * 1024 * 1024) {
        throw new Error(
          `Asset ${file} is larger than 20mb, please reduce its size`
        );
      }

      const fileHash = crypto
        .createHash("sha1")
        .update(fs.readFileSync(filePath))
        .digest("hex");
      const fileName = `${path.basename(
        file,
        path.extname(file)
      )}-${fileHash}${path.extname(file)}`;

      newAssetsMap.assets[file] = fileName;

      // if the file is already uploaded, skip it
      if (currentAssetsMap.assets[file] !== fileName) {
        filesToUpload.push({
          file,
          filePath,
          fileName,
        });
      }
    }

    if (filesToUpload.length > 0) {
      logger.log(
        `Uploading ${filesToUpload.length} file${
          filesToUpload.length > 1 ? "s" : ""
        }...`
      );

      for (const file of filesToUpload) {
        await fetchResult(`/parties/${user.login}/${config.name}/assets`, {
          user,
          method: "PUT",
          body: fs.createReadStream(file.filePath),
          headers: {
            ContentType: "application/octet-stream",
            "X-PartyKit-Asset-Name": file.fileName,
          },
          duplex: "half",
        });
        logger.log(`Uploaded ${file.file}`);
      }
    }

    await fetchResult(`/parties/${user.login}/${config.name}/assets`, {
      user,
      method: "POST",
      body: JSON.stringify(newAssetsMap),
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  const wasmModules: Record<string, Buffer> = {};

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

        resolveDir: process.cwd(),
        // TODO: setting a sourcefile name crashes the whole thing???
        // sourcefile: "./" + path.relative(process.cwd(), scriptPath),
      },
      ...esbuildOptions,
      minify: options.minify,
      define: {
        PARTYKIT_HOST: `"${config.name}.${user.login}.partykit.dev"`,
        ...esbuildOptions.define,
        ...config.define,
      },
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
                .update(fileContent)
                .digest("hex");
              const fileName = `./${fileHash}-${path
                .basename(args.path)
                .replace(/\?module$/, "")}`;

              wasmModules[fileName] = fs.readFileSync(filePath);

              return {
                path: fileName, // change the reference to the changed module
                external: true, // mark it as external in the bundle
                namespace: "partykit-module-wasm-publish", // just a tag, this isn't strictly necessary
              };
            });
          },
        },
      ],
    })
  ).outputFiles![0].text;

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

  if (assetsPath) {
    form.set("staticAssetsManifest", JSON.stringify(newAssetsMap));
  }

  for (const [fileName, buffer] of Object.entries(wasmModules)) {
    const uploadFileName = path.join("upload", fileName);
    form.set(
      uploadFileName,
      new File([buffer], uploadFileName, { type: "application/wasm" })
    );
  }

  if (config.compatibilityDate) {
    form.set("compatibilityDate", config.compatibilityDate);
  }
  if (config.compatibilityFlags) {
    form.set("compatibilityFlags", JSON.stringify(config.compatibilityFlags));
  }

  const urlSearchParams = new URLSearchParams();
  if (options.preview) {
    urlSearchParams.set("preview", options.preview);
  }

  const deployRes = await fetchResult<{
    result: { is_initial_deploy: boolean };
  }>(
    `/parties/${user.login}/${config.name}${
      options.preview ? `?${urlSearchParams.toString()}` : ""
    }`,
    {
      user,
      method: "POST",
      body: form,
    }
  );

  logger.log(
    `Deployed ${config.main} to https://${`${
      options.preview ? `${options.preview}.` : ""
    }${config.name}.${user.login.toLowerCase()}.partykit.dev`}`
  );
  if (deployRes.result.is_initial_deploy) {
    logger.log(
      `We're provisioning your partykit.dev domain. This can take up to ${chalk.bold(
        "2 minutes"
      )}. Hold tight!`
    );
  }
}

export async function _delete(options: {
  name: string | undefined;
  config: string | undefined;
  preview: string | undefined;
}) {
  const config = getConfig(options.config, options);
  if (!config.name) {
    throw new ConfigurationError(MissingProjectNameError);
  }
  // get user details
  const user = await getUser();

  const urlSearchParams = new URLSearchParams();
  if (options.preview) {
    urlSearchParams.set("preview", options.preview);
  }

  await fetchResult(
    `/parties/${user.login}/${config.name}${
      options.preview ? `?${urlSearchParams.toString()}` : ""
    }`,
    {
      user,
      method: "DELETE",
    }
  );

  logger.log(
    `Deleted ${chalk.bold(`${config.name}.${user.login}.partykit.dev`)}`
  );
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
    name: options.name,
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
    clientIp: options.ip,
  });

  const urlSearchParams = new URLSearchParams();
  if (options.preview) {
    urlSearchParams.set("preview", options.preview);
  }
  const {
    result: { id: tailId, url: websocketUrl, expires_at: expiration },
  } = await fetchResult<TailCreationApiResponse>(
    `/parties/${user.login}/${config.name}/tail${
      options.preview ? `?${urlSearchParams.toString()}` : ""
    }`,
    {
      user,
      method: "POST",
      body: JSON.stringify(filters),
    }
  );

  if (options.format === "pretty") {
    logger.log(
      `Successfully created tail, expires at ${expiration.toLocaleString()}`
    );
  }

  async function deleteTail() {
    await fetchResult(
      `/parties/${user.login}/${config.name}/tail/${tailId}${
        options.preview ? `?${urlSearchParams.toString()}` : ""
      }`,
      {
        user,
        method: "DELETE",
      }
    );
  }

  // connect to the tail
  const tailSocket = new WebSocket(websocketUrl, TRACE_VERSION, {
    headers: {
      "Sec-WebSocket-Protocol": TRACE_VERSION, // needs to be `trace-v1` to be accepted
      "User-Agent": `partykit/${packageVersion}`,
      "X-PartyKit-Version": packageVersion,
    },
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

export async function list(options: { format: "json" | "pretty" }) {
  // get user details
  const user = await getUser();

  const res = await fetchResult<{ name: string; url: string }[]>(
    `/parties/${user.login}`,
    { user }
  );

  if (options.format === "json") {
    console.log(res);
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
  logger.log(`PARTYKIT_LOGIN=${chalk.bold(session.login)}`);
  logger.log(`PARTYKIT_TOKEN=${chalk.bold(session.access_token)}`);
  logger.log("");
  logger.log("Store the token securely, it will not be shown again.");
}

export async function whoami() {
  // get user details
  try {
    const user = getUserConfig();
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
      name: options.name,
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
      `/parties/${user.login}/${config.name}/env?${urlSearchParams.toString()}`,
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
      name: options.name,
    });
    if (!config.name) {
      throw new ConfigurationError(MissingProjectNameError);
    }

    const urlSearchParams = new URLSearchParams();
    if (options.preview) {
      urlSearchParams.set("preview", options.preview);
    }

    const res = await fetchResult(
      `/parties/${user.login}/${config.name}/env${
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
          ...JSON.parse(fs.readFileSync(targetFileName, "utf8")),
          name: config.name,
          vars: res,
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
      name: options.name,
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
      `/parties/${user.login}/${config.name}/env${
        options.preview ? `?${urlSearchParams.toString()}` : ""
      }`,
      {
        user,
        method: "POST",
        body: JSON.stringify(config.vars || {}),
        headers: {
          "Content-Type": "application/json",
        },
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
      name: options.name,
    });
    if (!config.name) {
      throw new ConfigurationError(MissingProjectNameError);
    }

    const { default: prompt } = await import("prompts");

    const { value } = !process.stdin.isTTY
      ? // the value is being piped in
        await new Promise<{ value: string }>((resolve, reject) => {
          const stdin = process.openStdin();

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
          message: `Enter the value for ${key}`,
        });

    const urlSearchParams = new URLSearchParams();
    if (options.preview) {
      urlSearchParams.set("preview", options.preview);
    }

    await fetchResult(
      `/parties/${user.login}/${config.name}/env/${key}${
        options.preview ? `?${urlSearchParams.toString()}` : ""
      }`,
      {
        user,
        method: "POST",
        body: value,
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
      name: options.name,
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
        initial: true,
      });

      if (!value) {
        console.log("Aborted");
        return;
      } else {
        await fetchResult(
          `/parties/${user.login}/${config.name}/env${
            options.preview ? `?${urlSearchParams.toString()}` : ""
          }`,
          {
            user,
            method: "DELETE",
          }
        );
        logger.log(`Deleted all deployed environment variables`);
        return;
      }
    }

    await fetchResult(
      `/parties/${user.login}/${config.name}/env/${key}${
        options.preview ? `?${urlSearchParams.toString()}` : ""
      }`,
      {
        user,
        method: "DELETE",
      }
    );

    logger.log(`Deleted deployed environment variable: ${key}`);
  },
};
