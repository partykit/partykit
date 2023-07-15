#!/usr/bin/env node
import * as cli from "./cli";
import { version } from "../package.json";
import { Option, program /*, Option*/ } from "commander";
import React, { Suspense } from "react";

import Login from "./commands/login";
import Logout from "./commands/logout";

import { render } from "ink";
import { Dev } from "./dev";

// import packageJson from "../package.json";

// import("update-notifier").then(
//   ({ default: updateNotifier }) => {
//     // Checks for available update and returns an instance
//     const notifier = updateNotifier({ pkg: packageJson, distTag: "beta" });
//     // Notify using the built-in convenience method
//     notifier.notify();
//   },
//   (err) => {
//     console.error("Error loading update-notifier", err);
//   }
// );

process.on("SIGINT", () => {
  // console.log("Interrupted");
  process.exit(0);
});

process.on("SIGTERM", () => {
  // console.log("Terminated");
  process.exit(0);
});

process.on("exit", (_code) => {
  // console.log(`About to exit with code: ${_code}`);
});

process.on("uncaughtExceptionMonitor", function (err) {
  // console.error("uncaught exception", err);
  throw err;
});

process.on("unhandledRejection", function (reason, _promise) {
  // console.error("Unhandled Rejection at:", _promise, "reason:", reason);
  throw reason;
});

function getArrayKVOption(val: string[] = []) {
  return val.reduce((acc, curr) => {
    const [key, ...value] = curr.split("=");
    acc[key] = value.join("=");
    return acc;
  }, {} as Record<string, string>);
}

// const EnvironmentOption = new Option(
//   "-e, --env <env>",
//   "environment to use"
// ).choices(["production", "development", "preview"]);

program
  .name("partykit")
  .version(version, "-v, --version", "output the current version")
  .description("Welcome to the party, pal!");

program
  .command("dev")
  .description("run a script in development mode")
  .argument("[script]", "path to the script to run")
  .option("-p, --port <number>", "port to run the server on")
  .option("--assets <path>", "path to assets directory")
  .option("-c, --config <path>", "path to config file")
  .addOption(
    new Option("--persist [path]", "persist local state").default(true)
  )
  // .option("-e, --env", "environment to use")
  .option(
    "-v, --var [vars...]",
    "A key-value pair to be injected into the script as a variable"
  )
  .option(
    "-d, --define [defines...]",
    "A key-value pair to be substituted in the project"
  )
  .action(async (scriptPath, options) => {
    render(
      <Dev
        main={scriptPath}
        port={options.port}
        persist={options.persist}
        config={options.config}
        vars={getArrayKVOption(options.var)}
        define={getArrayKVOption(options.define)}
      />
    );
  });

program
  .command("deploy")
  .alias("publish")
  .description("deploy a script to the internet")
  .argument("[script]", "path to the script to deploy")
  .option("--assets <path>", "path to assets directory")
  .option("-c, --config <path>", "path to config file")
  // .option("-e, --env", "environment to use")
  .option(
    "-v, --var [vars...]",
    "A key-value pair to be injected into the script as a variable"
  )
  .option(
    "-d, --define [defines...]",
    "A key-value pair to be substituted in the script"
  )
  .option("--with-vars", "include all variables in the deployment")
  .option("-n, --name <name>", "name of the project")
  .option("--preview [name]", "deploy to preview environment")
  .action(async (scriptPath, options) => {
    await cli.deploy({
      main: scriptPath,
      name: options.name,
      config: options.config,
      vars: getArrayKVOption(options.var),
      define: getArrayKVOption(options.define),
      preview: options.preview,
      withVars: options.withVars,
      assets: options.assets,
    });
  });

program
  .command("list")
  .description("list all deployed projects")
  .action(async () => {
    await cli.list();
  });

program
  .command("delete")
  .description("delete a deployed project")
  .option("-n, --name <name>", "name of the project")
  .option("-c, --config <path>", "path to config file")
  .option("--preview [name]", "delete preview")
  .action(async (options) => {
    await cli._delete(options);
  });

program
  .command("tail")
  .description("tail logs from a deployed project")
  .option("-n, --name <name>", "name of the project")
  .option("-c, --config <path>", "path to config file")
  .option("--preview [name]", "tail logs from preview")
  .addOption(
    new Option("-f, --format", "format of the logs")
      .choices(["json", "pretty"])
      .default("pretty")
  )
  .option("--debug", "show debug logs", false)
  .addOption(
    new Option("--status", "filter by invocation status").choices([
      "ok",
      "error",
      "canceled",
    ])
  )
  .option("--header", "filter by HTTP header")
  .option("--method <...methods>", "filter by HTTP method(s)")
  .option("--sampling-rate <number>", "sampling rate of logs")
  .option("--search <string>", "search for a string in the logs")
  .option(
    "--ip <..ips>",
    'filter by the IP address the request originates from (use "self" to filter for your own IP)'
  )
  .action(async (options) => {
    await cli.tail(options);
  });

const envCommand = program.command("env");

envCommand
  .command("list")
  .description("list all environment variables")
  .option("-n, --name <name>", "name of the project")
  .option("-c, --config <path>", "path to config file")
  // .addOption(EnvironmentOption)
  // -p preview id?
  .action(async (options) => {
    await cli.env.list(options);
  });

envCommand
  .command("pull")
  .description("pull environment variables to a file")
  .argument("[file]", "file to pull development env vars to")
  .option("-n, --name <name>", "name of the project")
  .option("-c, --config <path>", "path to config file")
  .option("--preview [name]", "pull from preview")
  .action(async (fileName, options) => {
    await cli.env.pull(fileName, options);
  });

envCommand
  .command("push")
  .description("push environment variables from config file(s)")
  .option("-n, --name <name>", "name of the project")
  .option("-c, --config <path>", "path to config file")
  .option("--preview [name]", "push to preview")
  .action(async (options) => {
    await cli.env.push(options);
  });

envCommand
  .command("add")
  .description("add an environment variable")
  .argument("<key>", "name of the environment variable")
  .option("-n, --name <name>", "name of the project")
  .option("-c, --config <path>", "path to config file")
  .option("--preview [name]", "add to preview")
  // .addOption(EnvironmentOption)
  // -p preview id?
  .action(async (key, options) => {
    await cli.env.add(key, options);
  });

envCommand
  .command("remove")
  .description("remove an environment variable")
  .argument("[key]", "name of the environment variable")
  .option("-n, --name <name>", "name of the project")
  .option("-c, --config <path>", "path to config file")
  .option("--preview [name]", "remove from preview")
  // .addOption(EnvironmentOption)
  .action(async (key, options) => {
    await cli.env.remove(key, options);
  });

program
  .command("login")
  .description("login to partykit")
  .action(async () => {
    render(
      <Suspense>
        <Login />
      </Suspense>
    );
  });

program
  .command("logout")
  .description("logout from partykit")
  .action(async () => {
    render(
      <Suspense>
        <Logout />
      </Suspense>
    );
  });

// semiver implementation via https://github.com/lukeed/semiver/blob/ae7eebe6053c96be63032b14fb0b68e2553fcac4/src/index.js

/**
MIT License
Copyright (c) Luke Edwards <luke.edwards05@gmail.com> (lukeed.com)
Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

// eslint-disable-next-line @typescript-eslint/unbound-method
const fn = new Intl.Collator(undefined, { numeric: true }).compare;

function semiver(aStr: string, bStr: string, bool?: boolean) {
  const a = aStr.split(".");
  const b = bStr.split(".");

  return (
    fn(a[0], b[0]) ||
    fn(a[1], b[1]) ||
    ((b[2] = b.slice(2).join(".")),
    (bool = /[.-]/.test((a[2] = a.slice(2).join(".")))),
    bool == /[.-]/.test(b[2]) ? fn(a[2], b[2]) : bool ? -1 : 1)
  );
}

const MIN_NODE_VERSION = "16.8.0";

if (semiver(process.versions.node, MIN_NODE_VERSION) < 0) {
  // Note Volta and nvm are also recommended in the official docs:
  // https://developers.cloudflare.com/workers/get-started/guide#2-install-the-workers-cli
  console.error(
    `Partykit requires at least node.js v${MIN_NODE_VERSION}. You are using v${process.versions.node}. Please update your version of node.js.`
  );
  process.exit(1);
}

// end semiver implementation

program.parse(process.argv);
