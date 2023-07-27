import path from "path";
import assert from "assert";
import * as fs from "fs";
import { fetchResult } from "./fetchResult";
import { File, FormData } from "undici";
import type { BuildOptions } from "esbuild";
import * as crypto from "crypto";
import WebSocket from "ws";
import type { RawData } from "ws";
import onExit from "signal-exit";

import { Dev } from "./dev";
import type { DevProps } from "./dev";

export { Dev, DevProps };

import { execaCommand } from "execa";
import { version as packageVersion } from "../package.json";

import {
  getConfig,
  getConfigPath,
  getUser,

  // validateUserConfig,
} from "./config";
import type { TailFilterMessage } from "./tail/filters";
import { translateCLICommandToFilterMessage } from "./tail/filters";
import { jsonPrintLogs, prettyPrintLogs } from "./tail/printing";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const esbuildOptions: BuildOptions = {
  format: "esm",
  bundle: true,
  write: false,
  target: "esnext",
  // minify: true,
} as const;

// A map of room names to room servers.

export async function deploy(options: {
  main: string | undefined;
  name: string;
  config: string | undefined;
  assets: string | undefined;
  vars: Record<string, string> | undefined;
  define: Record<string, string> | undefined;
  preview: string | undefined;
  withVars: boolean | undefined;
}): Promise<void> {
  const config = getConfig(options.config, {
    main: options.main,
    name: options.name,
    assets: options.assets,
    vars: options.vars,
    define: options.define,
  });

  if (!config.main) {
    throw new Error(
      'Missing entry point, please specify "main" in your config'
    );
  }

  const configName = config.name;
  assert(
    configName,
    'Missing project name, please specify "name" in your config'
  );

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

  if (config.assets) {
    console.warn(
      "Warning: uploading assets are not yet supported in deploy mode"
    );
  }

  const absoluteScriptPath = path.join(process.cwd(), config.main).replace(
    /\\/g, // windows
    "/"
  );

  // get user details
  const user = await getUser();

  const wasmModules: Record<string, Buffer> = {};

  const esbuild = await import("esbuild");
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
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
      define: {
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

  for (const [fileName, buffer] of Object.entries(wasmModules)) {
    form.set(
      `upload/${fileName}`,
      new File([buffer], `upload/${fileName}`, { type: "application/wasm" })
    );
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

  console.log(
    `Deployed ${config.main} as ${
      options.preview ? `${options.preview}.` : ""
    }${config.name}.${user.login.toLowerCase()}.partykit.dev`
  );
}

export async function _delete(options: {
  name: string | undefined;
  config: string | undefined;
  preview: string | undefined;
}) {
  const config = getConfig(options.config, options);
  if (!config.name) {
    throw new Error("project name is missing");
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

  console.log(`Deleted ${config.name}.${user.login}.partykit.dev`);
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
    throw new Error("project name is missing");
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
    console.log(
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
    console.log(`Connected to ${scriptDisplayName}, waiting for logs...`);
  }

  tailSocket.on("close", async () => {
    tailSocket.terminate();
    await deleteTail();
  });
}

export async function list() {
  // get user details
  const user = await getUser();

  const res = await fetchResult(`/parties/${user.login}`, {
    headers: {
      Authorization: `Bearer ${user.access_token}`,
    },
  });

  console.log(res);
}

// type EnvironmentChoice = "production" | "development" | "preview";

export const env = {
  async list(options: {
    name: string | undefined;
    // env: EnvironmentChoice;
    config: string | undefined;
    preview: string | undefined;
  }) {
    // get user details
    const user = await getUser();

    const config = getConfig(options.config, {
      name: options.name,
    });
    if (!config.name) {
      throw new Error("project name is missing");
    }

    const urlSearchParams = new URLSearchParams();
    urlSearchParams.set("keys", "true");
    if (options.preview) {
      urlSearchParams.set("preview", options.preview);
    }

    const res = await fetchResult(
      `/parties/${user.login}/${config.name}/env?${urlSearchParams.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${user.access_token}`,
        },
      }
    );

    console.log(res);
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
      throw new Error("project name is missing");
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
      console.log(`Creating ${targetFileName}...`);
      fs.writeFileSync(targetFileName, "{}");
    } else {
      console.log(`Updating ${targetFileName}...`);
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
      throw new Error("project name is missing");
    }

    const urlSearchParams = new URLSearchParams();
    if (options.preview) {
      urlSearchParams.set("preview", options.preview);
    }

    if (Object.keys(config.vars || {}).length === 0) {
      console.warn("No environment variables to push, exiting...");
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

    console.log("Pushed environment variables");
  },
  async add(
    key: string,
    options: {
      name: string | undefined;
      // env: EnvironmentChoice;
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
      throw new Error("project name is missing");
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

    const res = await fetchResult(
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

    console.log(res);
  },
  async remove(
    key: string | undefined,
    options: {
      name: string | undefined;
      // env: EnvironmentChoice;
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
      throw new Error("project name is missing");
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
        const res = await fetchResult(
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
        console.log(res);
        return;
      }
    }

    const res = await fetchResult(
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

    console.log(res);
  },
};
