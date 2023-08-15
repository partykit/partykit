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

import { Dev } from "./dev";
import type { DevProps } from "./dev";

export { Dev, DevProps };

import { execaCommand } from "execa";
import { version as packageVersion } from "../package.json";

import { getConfig, getConfigPath, getUser, getUserConfig } from "./config";
import type { TailFilterMessage } from "./tail/filters";
import { translateCLICommandToFilterMessage } from "./tail/filters";
import { jsonPrintLogs, prettyPrintLogs } from "./tail/printing";
import { render } from "ink";
import React from "react";
import chalk from "chalk";
import { ConfigurationError, logger } from "./logger";
import type { StaticAssetsManifestType } from "./server";
import findConfig from "find-config";
import { fileURLToPath } from "url";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function init(options: {
  name: string | undefined;
  yes: boolean | undefined;
}) {
  const pathToProject = path.join(process.cwd(), options.name || "");
  fs.mkdirSync(pathToProject, { recursive: true });
  process.chdir(pathToProject);

  const logInstructions = [];

  const projectName = path.basename(pathToProject);

  // look for a package.json (that doesn't have workspaces defined)
  const packageJsonPath = findConfig("package.json");
  let shouldInitNewPackageJson = true;
  let shouldRunNpmInstall = true;
  if (packageJsonPath) {
    shouldInitNewPackageJson = false;
    const packageJson = JSON.parse(
      fs.readFileSync(packageJsonPath, { encoding: "utf-8" })
    );
    if (packageJson.workspaces) {
      shouldInitNewPackageJson = true;
    }
  }

  if (shouldInitNewPackageJson) {
    // init a new package.json
    const packageJson = {
      name: projectName,
      version: "0.0.0",
      private: true,
      scripts: {
        dev: "partykit dev",
        deploy: "partykit deploy",
      },
      dependencies: {
        partykit: packageVersion,
        partysocket: packageVersion,
      },
    };
    fs.writeFileSync(
      path.join(pathToProject, "package.json"),
      JSON.stringify(packageJson, null, 2)
    );
  } else {
    // add dev and deploy scripts
    const packageJson = JSON.parse(
      fs.readFileSync(packageJsonPath!, { encoding: "utf-8" })
    );
    packageJson.scripts = packageJson.scripts || {};
    if (!packageJson.scripts.dev) {
      packageJson.scripts.dev = "partykit dev";
      logInstructions.push(
        `To start your dev server, run: ${chalk.bold("npm run dev")}\n`
      );
    } else {
      logInstructions.push(
        `To start your dev server, run: ${chalk.bold("npx partykit dev")}\n`
      );
    }

    if (!packageJson.scripts.deploy) {
      packageJson.scripts.dev = "partykit deploy";
      logInstructions.push(
        `To start your dev server, run: ${chalk.bold("npm run deploy")}\n`
      );
    } else {
      logInstructions.push(
        `To start your dev server, run: ${chalk.bold("npx partykit deploy")}\n`
      );
    }

    // add the partykit dependency
    packageJson.dependencies ||= {};
    if (!packageJson.dependencies.partykit) {
      packageJson.dependencies.partykit = packageVersion;
      packageJson.dependencies.partysocket = packageVersion;
    } else {
      shouldRunNpmInstall = false;
    }

    fs.writeFileSync(packageJsonPath!, JSON.stringify(packageJson, null, 2));
  }

  if (shouldRunNpmInstall) {
    // run npm install from packageJsonPath
    await execaCommand(
      findConfig("yarn.lock")
        ? "yarn"
        : findConfig("pnpm-lock.yaml")
        ? "pnpm install"
        : "npm install",
      {
        cwd: packageJsonPath ? path.dirname(packageJsonPath) : pathToProject,
        stdio: "inherit",
      }
    );
  }

  // ok now let's copy over the files from init-template to the new project
  const templatePath = path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    "..",
    "init-template"
  );
  for (const file of findAllFiles(templatePath)) {
    const source = path.join(templatePath, file);
    const dest = path.join(pathToProject, file);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(source, dest);
  }

  // rename gitignore to .gitignore
  fs.renameSync(
    path.join(pathToProject, "gitignore"),
    path.join(pathToProject, ".gitignore")
  );

  // replace $PROJECT_NAME in partykit.json
  const partykitJsonPath = path.join(pathToProject, "partykit.json");
  fs.writeFileSync(
    partykitJsonPath,
    fs
      .readFileSync(partykitJsonPath, { encoding: "utf-8" })
      .replace(/\$PROJECT_NAME/g, projectName)
  );
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

const MissingProjectNameError = `Missing project name, please specify "name" in your config, or pass it in via the CLI with --name <name>`;
const MissingEntryPointError = `Missing entry point, please specify "main" in your config, or pass it in via the CLI`;

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

  if (config.serve) {
    logger.warn(
      "Deploying static assets is experimental and may change any time"
    );
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
    serveSinglePageApp: assetsConfig.serveSinglePageApp,
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
    define: {
      "process.env.PARTYKIT_HOST": `"${config.name}.${user.login}.partykit.dev"`,
      ...config.define,
      ...assetsBuild?.define,
    },
    loader: assetsBuild?.loader,
  };

  const unsupportedKeys = (
    ["include", "exclude", "serveSinglePageApp"] as const
  ).filter((key) => assetsConfig[key] !== undefined);
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
      headers: {
        Authorization: `Bearer ${user.access_token}`,
        "Content-Type": "application/json",
      },
    });

    const filesToUpload = [];

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
          method: "PUT",
          body: fs.createReadStream(file.filePath),
          headers: {
            Authorization: `Bearer ${user.access_token}`,
            ContentType: "application/octet-stream",
            "X-PartyKit-Asset-Name": file.fileName,
          },
          duplex: "half",
        });
        logger.log(`Uploaded ${file.file}`);
      }
    }

    await fetchResult(`/parties/${user.login}/${config.name}/assets`, {
      method: "POST",
      body: JSON.stringify(newAssetsMap),
      headers: {
        Authorization: `Bearer ${user.access_token}`,
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
                `import ${name}Party from '${party}'; export const ${name} = ${name}Party;`
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
        "process.env.PARTYKIT_HOST": `"${config.name}.${user.login}.partykit.dev"`,
        ...esbuildOptions.define,
        ...config.define,
      },
      plugins: [
        {
          name: "partykit-wasm-publish",
          setup(build) {
            build.onResolve({ filter: /\.wasm$/ }, (args) => {
              throw new Error(
                `Cannot import .wasm files directly. Use import "${args.path}?module" instead.`
              );
            });

            build.onResolve({ filter: /\.wasm\?module$/ }, (args) => {
              const filePath = path.join(
                args.resolveDir,
                args.path.replace(/\?module$/, "")
              );
              const fileContent = fs.readFileSync(filePath);
              const fileHash = crypto
                .createHash("sha1")
                .update(fileContent)
                .digest("hex");
              const fileName = `${fileHash}-${path.basename(
                args.path,
                ".wasm?module"
              )}`;

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
    form.set(
      `upload/${fileName}`,
      new File([buffer], `upload/${fileName}`, { type: "application/wasm" })
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

  await fetchResult(
    `/parties/${user.login}/${config.name}${
      options.preview ? `?${urlSearchParams.toString()}` : ""
    }`,
    {
      method: "POST",
      body: form,
      headers: {
        Authorization: `Bearer ${user.access_token}`,
        "X-PartyKit-User-Type": user.type,
      },
    }
  );

  logger.log(
    `Deployed ${config.main} to ${`${
      options.preview ? `${options.preview}.` : ""
    }${config.name}.${user.login.toLowerCase()}.partykit.dev`}`
  );
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
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${user.access_token}`,
      },
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
      method: "POST",
      body: JSON.stringify(filters),
      headers: {
        Authorization: `Bearer ${user.access_token}`,
      },
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
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${user.access_token}`,
        },
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

  onExit(async () => {
    tailSocket.terminate();
    await deleteTail();
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
    {
      headers: {
        Authorization: `Bearer ${user.access_token}`,
      },
    }
  );

  if (options.format === "json") {
    console.log(res);
  } else {
    render(<InkTable data={res} />);
  }
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
      {
        headers: {
          Authorization: `Bearer ${user.access_token}`,
        },
      }
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
      {
        headers: {
          Authorization: `Bearer ${user.access_token}`,
        },
      }
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
        method: "POST",
        body: JSON.stringify(config.vars || {}),
        headers: {
          Authorization: `Bearer ${user.access_token}`,
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
        method: "POST",
        body: value,
        headers: {
          Authorization: `Bearer ${user.access_token}`,
        },
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
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${user.access_token}`,
            },
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
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${user.access_token}`,
        },
      }
    );

    logger.log(`Deleted deployed environment variable: ${key}`);
  },
};
