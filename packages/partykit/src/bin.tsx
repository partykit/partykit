// A shebang will be inserted by the build script
import * as cli from "./cli";
import { Option, program /*, Option*/ } from "commander";
import React, { Suspense } from "react";
import updateNotifier from "update-notifier";

import Login from "./commands/login";
import Logout from "./commands/logout";

import { render } from "ink";
import { Dev } from "./dev";

import gradient from "gradient-string";

import {
  version as packageVersion,
  name as packageName,
} from "../package.json";
import { ConfigurationError, logger } from "./logger";

async function printBanner() {
  const notifier = updateNotifier({
    pkg: {
      name: packageName,
      version: packageVersion,
    },
    updateCheckInterval:
      process.env.NODE_ENV !== "production" ? 0 : 1000 * 60 * 60 * 24,
  });

  const string =
    `🎈 PartyKit v${packageVersion}` +
    (notifier.update ? ` (update available: ${notifier.update.latest})` : "");
  console.log(gradient.fruit(string));
  console.log(gradient.passion(`-`.repeat(string.length + 1)));
}

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
  if (err instanceof ConfigurationError) {
    logger.error(err.message);
    process.exit(1);
  } else {
    throw err;
  }
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

program
  .name("partykit")
  .version(packageVersion, "-v, --version", "Output the current version")
  .description("Welcome to the party, pal!")
  .action(async () => {
    await printBanner();
    program.help();
  });

program
  .command("init")
  .description("Add PartyKit to a project")
  .argument("[name]", "Name of the project")
  .option("-y, --yes", "Skip prompts")
  .option("--dry-run", "Skip writing files and installing dependencies")
  .action(async (name, options) => {
    await printBanner();
    await cli.init({
      dryRun: options.dryRun,
      name,
      yes: options.yes,
    });
  });
program
  .command("dev")
  .description("Run a project in development mode")
  .argument("[script]", "Path to the project to run")
  .option("--ip <address>", "IP address to run the server on")
  .option("-p, --port <number>", "Port to run the server on")
  .option("--serve <path>", "Serve this directory of static assets")
  .addOption(
    new Option(
      "--unstable_outdir <path>",
      "Output directory for builds"
    ).hideHelp()
  )
  .option("-c, --config <path>", "Path to config file")
  .addOption(
    new Option("--persist [path]", "Persist local state").default(true)
  )
  .option(
    "-v, --var [vars...]",
    "A key-value pair to be injected into the script as a variable"
  )
  .option(
    "-d, --define [defines...]",
    "A key-value pair to be substituted in the project"
  )
  .option("--compatibility-date <date>", "Set a compatibility date")
  .option("--compatibility-flags [flags...]", "Set compatibility flags")
  .option("--minify", "Minify the script")
  .option("--verbose", "Verbose debugging output")
  .action(async (scriptPath, options) => {
    await printBanner();
    render(
      <Dev
        main={scriptPath}
        unstable_outdir={options.unstable_outdir}
        ip={options.ip}
        port={options.port ? parseInt(options.port) : undefined}
        persist={options.persist}
        config={options.config}
        vars={getArrayKVOption(options.var)}
        define={getArrayKVOption(options.define)}
        compatibilityDate={options.compatibilityDate}
        compatibilityFlags={options.compatibilityFlags}
        minify={options.minify}
        verbose={options.verbose}
        serve={options.serve}
      />
    );
  });

program
  .command("deploy")
  .alias("publish")
  .description("Deploy a project to the PartyKit platform")
  .argument("[script]", "Path to the project to deploy")
  .option("--serve <path>", "Serve this directory of static assets")
  .option("-c, --config <path>", "Path to config file")
  .option(
    "-v, --var [vars...]",
    "A key-value pair to be injected into the project as a variable"
  )
  .option(
    "-d, --define [defines...]",
    "A key-value pair to be substituted in the project"
  )
  .option("--compatibility-date <date>", "Set a compatibility date")
  .option("--compatibility-flags [flags...]", "Set compatibility flags")
  .option("--minify", "Minify the script")
  .option("--with-vars", "Include all variables in the deployment")
  .option("-n, --name <name>", "Name of the project")
  .option("--preview [name]", "Deploy to preview environment")
  .action(async (scriptPath, options) => {
    await printBanner();
    await cli.deploy({
      main: scriptPath,
      name: options.name,
      config: options.config,
      vars: getArrayKVOption(options.var),
      define: getArrayKVOption(options.define),
      preview: options.preview,
      withVars: options.withVars,
      serve: options.serve,
      compatibilityDate: options.compatibilityDate,
      compatibilityFlags: options.compatibilityFlags,
      minify: options.minify,
    });
  });

program
  .command("list")
  .description("List all deployed projects")
  .addOption(
    new Option("-f, --format <format>")
      .choices(["json", "pretty"])
      .default("pretty")
  )
  .action(async (options) => {
    if (options.format !== "json") {
      await printBanner();
    }
    await cli.list(options);
  });

program
  .command("delete")
  .description("Delete a deployed project")
  .option("-n, --name <name>", "Name of the project")
  .option("-f, --force", "Force delete without confirmation")
  .option("-c, --config <path>", "Path to config file")
  .option("--preview [name]", "Delete preview")
  .action(async (options) => {
    await printBanner();
    await cli._delete(options);
  });

program
  .command("tail")
  .description("Stream live logs from a deployed project")
  .option("-n, --name <name>", "Name of the project")
  .option("-c, --config <path>", "Path to config file")
  .option("--preview [name]", "Tail logs from preview")
  .addOption(
    new Option("-f, --format <format>", "Format of the logs")
      .choices(["json", "pretty"])
      .default("pretty")
  )
  .option("--debug", "Show debug logs", false)
  .addOption(
    new Option("--status <status>", "Filter by invocation status").choices([
      "ok",
      "error",
      "canceled",
    ])
  )
  .option("--header", "Filter by HTTP header")
  .option("--method <...methods>", "Filter by HTTP method(s)")
  .option("--sampling-rate <number>", "Sampling rate of logs")
  .option("--search <string>", "Search for a string in the logs")
  .option(
    "--ip <..ips>",
    'Filter by the IP address the request originates from (use "self" to filter for your own IP)'
  )
  .action(async (options) => {
    if (options.format !== "json") {
      await printBanner();
    }
    await cli.tail(options);
  });

const envCommand = program
  .command("env")
  .description("Manage environment variables")
  .action(async () => {
    await printBanner();
    envCommand.outputHelp();
  });

envCommand
  .command("list")
  .description("List all environment variables")
  .option("-n, --name <name>", "Name of the project")
  .option("-c, --config <path>", "Path to config file")
  .addOption(
    new Option("-f, --format <format>")
      .choices(["json", "pretty"])
      .default("pretty")
  )
  .action(async (options) => {
    if (options.format !== "json") {
      await printBanner();
    }
    await cli.env.list(options);
  });

envCommand
  .command("pull")
  .description("Pull environment variables to a file")
  .argument("[file]", "File to save environment variables to")
  .option("-n, --name <name>", "Name of the project")
  .option("-c, --config <path>", "Path to config file")
  .option("--preview [name]", "Pull from preview")
  .action(async (fileName, options) => {
    await printBanner();
    await cli.env.pull(fileName, options);
  });

envCommand
  .command("push")
  .description("Push environment variables from config file(s)")
  .option("-n, --name <name>", "Name of the project")
  .option("-c, --config <path>", "Path to config file")
  .option("--preview [name]", "Push to preview")
  .action(async (options) => {
    await printBanner();
    await cli.env.push(options);
  });

envCommand
  .command("add")
  .description("Add an environment variable")
  .argument("<key>", "Name of the environment variable")
  .option("-n, --name <name>", "Name of the project")
  .option("-c, --config <path>", "Path to config file")
  .option("--preview [name]", "Add to preview")
  .action(async (key, options) => {
    await printBanner();
    await cli.env.add(key, options);
  });

envCommand
  .command("remove")
  .description("Remove an environment variable")
  .argument("[key]", "Name of the environment variable")
  .option("-n, --name <name>", "Name of the project")
  .option("-c, --config <path>", "Path to config file")
  .option("--preview [name]", "Remove from preview")
  .action(async (key, options) => {
    await printBanner();
    await cli.env.remove(key, options);
  });

program
  .command("login")
  .description("Login to PartyKit")
  .addOption(
    new Option(
      "-p, --provider <provider>",
      "login provider (experimental)"
    ).choices(["github", "partykit"])
  )
  .action(async ({ provider }: { provider?: "github" | "partykit" }) => {
    await printBanner();
    render(
      <Suspense>
        <Login method={provider === "partykit" ? "clerk" : provider} />
      </Suspense>
    );
  });

program
  .command("logout")
  .description("Logout from PartyKit")
  .action(async () => {
    await printBanner();
    render(
      <Suspense>
        <Logout />
      </Suspense>
    );
  });

program
  .command("whoami")
  .description("Show the currently logged in user")
  .action(async () => {
    await printBanner();
    await cli.whoami();
  });

const tokenCommand = program
  .command("token")
  .description("Manage authentication tokens")
  .action(async () => {
    await printBanner();
    tokenCommand.outputHelp();
  });

tokenCommand
  .command("generate")
  .description("Generate a secret authentication token")
  .action(async () => {
    await printBanner();
    await cli.generateToken();
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

const MIN_NODE_VERSION = "18.0.0";

if (semiver(process.versions.node, MIN_NODE_VERSION) < 0) {
  console.error(
    `Partykit requires at least node.js v${MIN_NODE_VERSION}. You are using v${process.versions.node}. Please update your version of node.js.`
  );
  process.exit(1);
}

// end semiver implementation

program.parse(process.argv);
