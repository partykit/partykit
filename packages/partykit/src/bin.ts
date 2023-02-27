#!/usr/bin/env node --enable-source-maps
import * as cli from "./cli";
import { version } from "../package.json";
import { program, Option } from "commander";

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

const EnvironmentOption = new Option(
  "-e, --env <env>",
  "environment to use"
).choices(["production", "development", "preview"]);

program
  .name("partykit")
  .version(version, "-v, --version", "output the current version")
  .description("Welcome to the party, pal!");

program
  .command("dev")
  .description("run a script in development mode")
  .argument("<script>", "path to the script to run")
  .option("-p, --port", "port to run the server on")
  .action(async (scriptPath, options) => {
    await cli.dev(scriptPath, { port: options.port });
  });

program
  .command("deploy")
  .description("deploy a script to the internet")
  .argument("<script>", "path to the script to deploy")
  .requiredOption("-n, --name <name>", "name of the script")
  .action(async (scriptPath, options) => {
    await cli.deploy(scriptPath, { name: options.name });
  });

program
  .command("list")
  .description("list all deployed scripts")
  .action(async () => {
    await cli.list();
  });

program
  .command("delete")
  .description("delete a deployed script")
  .requiredOption("-n, --name <name>", "name of the script")
  .action(async (options) => {
    await cli._delete({ name: options.name });
  });

const envCommand = program.command("env");

envCommand
  .command("list")
  .description("list all environment variables")
  .requiredOption("-n, --name <name>", "name of the script")
  .addOption(EnvironmentOption)
  // -p preview id?
  .action(async (options) => {
    await cli.env.list(options);
  });

envCommand
  .command("pull")
  .description("pull environment variables to a file")
  .argument("<file>", "file to pull development env vars to")
  .requiredOption("-n, --name <name>", "name of the script")
  // implies "development" environment
  .action(async (fileName, options) => {
    await cli.env.pull(fileName, options);
  });

envCommand
  .command("add")
  .description("add an environment variable")
  .argument("<key>", "name of the environment variable")
  .requiredOption("-n, --name <name>", "name of the script")
  .addOption(EnvironmentOption)
  // -p preview id?
  .action(async (key, options) => {
    await cli.env.add(key, options);
  });

envCommand
  .command("remove")
  .description("remove an environment variable")
  .argument("<key>", "name of the environment variable")
  .requiredOption("-n, --name <name>", "name of the script")
  .addOption(EnvironmentOption)
  .action(async (key, options) => {
    await cli.env.remove(key, options);
  });

program
  .command("login")
  .description("login to partykit")
  .action(async () => {
    await cli.login();
  });

program
  .command("logout")
  .description("logout from partykit")
  .action(async () => {
    await cli.logout();
  });

// semiver implementation via https://github.com/lukeed/semiver/blob/ae7eebe6053c96be63032b14fb0b68e2553fcac4/src/index.js

/**
MIT License
Copyright (c) Luke Edwards <luke.edwards05@gmail.com> (lukeed.com)
Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

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

const MIN_NODE_VERSION = "18.11.1";

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
