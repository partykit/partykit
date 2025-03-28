// A shebang will be inserted by the build script
import { createReadStream } from "node:fs";
import { createInterface } from "node:readline";

import React, { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import chalk from "chalk";
import { Option, program /*, Option*/ } from "commander";
import gradient from "gradient-string";
import { Box, render, Text } from "ink";
import { File, FormData } from "undici";
import updateNotifier from "update-notifier";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

import {
  name as packageName,
  version as packageVersion
} from "../package.json";
import { listModels } from "./ai";
import * as CFAuth from "./cf-auth";
import * as cli from "./cli";
import Login from "./commands/login";
import Logout from "./commands/logout";
import { Dev } from "./dev";
import { ConfigurationError, logger } from "./logger";
import * as vectorize from "./vectorize/client";

import type {
  VectorizeDistanceMetric,
  // @ts-expect-error hmm odd
  VectorizePreset
} from "@cloudflare/workers-types";
import type { Interface as RLInterface } from "node:readline";

async function printBanner() {
  const notifier = updateNotifier({
    pkg: {
      name: packageName,
      version: packageVersion
    },
    updateCheckInterval:
      process.env.NODE_ENV !== "production" ? 0 : 1000 * 60 * 60 * 24
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

function uncaughtExceptionHandler(err: Error) {
  if (err instanceof ConfigurationError) {
    logger.error(err.message);
    process.exit(1);
  } else if (err instanceof ZodError) {
    logger.error(fromZodError(err).toString());
    process.exit(1);
  } else {
    throw err;
  }
}

process.on("uncaughtExceptionMonitor", uncaughtExceptionHandler);

process.on("unhandledRejection", function (reason, _promise) {
  uncaughtExceptionHandler(reason as Error);
  // console.error("Unhandled Rejection at:", _promise, "reason:", reason);
  throw reason;
});

function getArrayKVOption(val: string[] = []) {
  return val.reduce(
    (acc, curr) => {
      const [key, ...value] = curr.split("=");
      acc[key] = value.join("=");
      return acc;
    },
    {} as Record<string, string>
  );
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
      yes: options.yes
    });
  });
program
  .command("dev")
  .description("Run a project in development mode")
  .argument("[script]", "Path to the project to run")
  .option("-p, --port <number>", "Port to run the server on")
  .option("--serve <path>", "Serve this directory of static assets")
  .addOption(
    new Option(
      "--unstable_outdir <path>",
      "Output directory for builds"
    ).hideHelp()
  )
  .option("--https", "enable https")
  .option("--https-key-path <path>", "Path to https key file")
  .option("--https-cert-path <path>", "Path to https cert file")
  .option("-c, --config <path>", "Path to config file")
  .addOption(
    new Option("--persist [path]", "Persist local state").default(true)
  )
  .option(
    "-v, --var <vars...>",
    "A key-value pair to be injected into the script as a variable"
  )
  .option(
    "-d, --define <defines...>",
    "A key-value pair to be substituted in the project"
  )
  .option("--compatibility-date <date>", "Set a compatibility date")
  .option("--compatibility-flags <flags...>", "Set compatibility flags")
  .option("--minify", "Minify the script")
  .option("--live", "Enable live reload")
  .option("--with-env", "Define all variables in the deployment")
  .option("--disable-request-cf-fetch", "Disable populating request.cf")
  .option("--verbose", "Verbose debugging output")
  .option("--no-hotkeys", "Disable hot keys")
  .action(async (scriptPath, options) => {
    await printBanner();
    render(
      <ErrorBoundary
        fallbackRender={() => null}
        onError={uncaughtExceptionHandler}
      >
        <Dev
          main={scriptPath}
          disableRequestCfFetch={options.disableRequestCfFetch}
          unstable_outdir={options.unstable_outdir}
          port={options.port ? parseInt(options.port) : undefined}
          persist={options.persist}
          config={options.config}
          vars={getArrayKVOption(options.var)}
          define={getArrayKVOption(options.define)}
          https={options.https}
          httpsKeyPath={options.httpsKeyPath}
          httpsCertPath={options.httpsCertPath}
          live={options.live}
          hotkeys={options.hotkeys}
          withEnv={options.withEnv}
          compatibilityDate={options.compatibilityDate}
          compatibilityFlags={options.compatibilityFlags}
          minify={options.minify}
          verbose={options.verbose}
          serve={options.serve}
        />
      </ErrorBoundary>
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
    "-v, --var <vars...>",
    "A key-value pair to be injected into the project as a variable"
  )
  .option(
    "-d, --define <defines...>",
    "A key-value pair to be substituted in the project"
  )
  .option("--compatibility-date <date>", "Set a compatibility date")
  .option("--compatibility-flags <flags...>", "Set compatibility flags")
  .option("--minify", "Minify the script")
  .option("--with-vars", "Include all variables in the deployment")
  .option("--with-env", "Define all variables in the deployment")
  .option("-n, --name <name>", "Name of the project")
  .option("--preview <name>", "Deploy to preview environment")
  .option("--domain <domain>", "Custom domain for the project")
  .option(
    "--tail-consumer <worker...>",
    "Send logs to another worker (cloud-prem only)"
  )
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
      tailConsumers: options.tailConsumer,
      minify: options.minify,
      withEnv: options.withEnv,
      domain: options.domain
    });
  });

program
  .command("list")
  .option("-c, --config <path>", "Path to config file")
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
  .option("--preview <name>", "Delete preview")
  .action(async (options) => {
    await printBanner();
    await cli._delete(options);
  });

program
  .command("info")
  .description("Get information about a deployed project")
  .option("-n, --name <name>", "Name of the project")
  .option("-c, --config <path>", "Path to config file")
  .option("--preview <name>", "Get info about preview")
  .action(async (options) => {
    await printBanner();
    await cli.info(options);
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
      "canceled"
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

if (process.env.CF_LOGIN_TESTS) {
  console.warn("☢️ You probably shouldn't be using this. Go back.");

  const cloudflareCommand = program
    .command("cloudflare")
    .description("Manage Cloudflare Account")
    .action(async () => {
      await printBanner();
      cloudflareCommand.outputHelp();
    });

  cloudflareCommand
    .command("login")
    .description("Login to Cloudflare")
    .action(async () => {
      const loggedIn = await CFAuth.login({ browser: true });
      console.log({ loggedIn });
    });

  cloudflareCommand
    .command("login")
    .description("Logout from Cloudflare")
    .action(async () => {
      await CFAuth.logout();
    });

  cloudflareCommand
    .command("whoami")
    .description("Show Account information")
    .action(async () => {
      await CFAuth.whoami();
    });
}

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
  .option("--preview [name]", "List from preview")
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
  .option("--preview <name>", "Pull from preview")
  .action(async (fileName, options) => {
    await printBanner();
    await cli.env.pull(fileName, options);
  });

envCommand
  .command("push")
  .description("Push environment variables from config file(s)")
  .option("-n, --name <name>", "Name of the project")
  .option("-c, --config <path>", "Path to config file")
  .option("--preview <name>", "Push to preview")
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
  .option("--preview <name>", "Add to preview")
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
  .option("--preview <name>", "Remove from preview")
  .action(async (key, options) => {
    await printBanner();
    await cli.env.remove(key, options);
  });

/**
 * AI commands
 */

const aiCommand = program
  .command("ai")
  .description("Manage AI models")
  .action(async () => {
    await printBanner();
    aiCommand.outputHelp();
  });
aiCommand
  .command("models")
  .option("-c, --config <path>", "Path to config file")
  .option("--json", "Return output as clean JSON", false)
  .action(async (args) => {
    logger.log(`📋 Listing available AI models...\n`);
    const models = await listModels({ config: args.config });

    if (args.json) {
      logger.log(JSON.stringify(models, null, 2));
      return;
    }

    for (const { name, description } of models) {
      logger.log(`${chalk.bold(name)}: ${description}\n`);
    }
  });

/**
 * Vectorize commands
 */

const vectorizeCommand = program
  .command("vectorize")
  .description("Manage vectorize indexes")
  .action(async () => {
    await printBanner();
    vectorizeCommand.outputHelp();
  });

vectorizeCommand
  .command("create")
  .description("Create a vectorize index")
  .argument(
    "<name>",
    "The name of the Vectorize index to create (must be unique)."
  )
  .option(
    "--dimensions <dimensions>",
    "The dimension size to configure this index for, based on the output dimensions of your ML model",
    parseFloat
  )
  .addOption(
    new Option(
      "--metric <format>",
      "The distance metric to use for searching within the index."
    ).choices(["euclidean", "cosine", "dot-product"])
  )
  .addOption(
    new Option(
      "--preset <preset>",
      "The name of an preset representing an embeddings model: Vectorize will configure the dimensions and distance metric for you when provided."
    ).choices([
      "@cf/baai/bge-small-en-v1.5",
      "@cf/baai/bge-base-en-v1.5",
      "@cf/baai/bge-large-en-v1.5",
      "openai/text-embedding-ada-002",
      "cohere/embed-multilingual-v2.0"
    ])
  )
  .option(
    "--description <description>",
    "An optional description for this index."
  )
  .option("--json", "Return output as clean JSON", false)
  .option("-c, --config <path>", "Path to config file")
  .action(async (name, args) => {
    // TODO: validate index name
    await printBanner();

    let indexConfig;

    if (args.preset && (args.dimensions || args.metric)) {
      logger.error(
        "You must provide either a preset or both dimensions and a metric, but not both."
      );
      return;
    }

    if (args.preset) {
      indexConfig = { preset: args.preset as VectorizePreset };
      logger.log(
        `Configuring index based for the embedding model ${args.preset}.`
      );
    } else if (args.dimensions && args.metric) {
      // We let the server validate the supported (maximum) dimensions so that we
      // don't have to keep partykit in sync with server-side changes
      indexConfig = {
        metric: args.metric as VectorizeDistanceMetric,
        dimensions: args.dimensions as number
      };
    } else {
      logger.error(
        "You must provide both dimensions and a metric, or a known model preset when creating an index."
      );
      return;
    }

    const index = {
      name: name,
      description: args.description,
      config: indexConfig
    };

    logger.log(`🚧 Creating index: '${name}'`);

    await vectorize.createIndex({
      config: args.config,
      body: index
    });

    if (args.json) {
      logger.log(JSON.stringify(index, null, 2));
      return;
    }

    render(
      <Box flexDirection="column">
        <Text>
          ✅ Successfully created a new Vectorize index: &apos;
          {name}&apos;
        </Text>
        <Text>
          📋 To start querying from your project, add the following
          configuration into &apos;partykit.json&apos;:
        </Text>
        <Text>&nbsp;</Text>
        <Text>{`"vectorize": { "index_name": "${name}" }`}</Text>
      </Box>
    );
  });

vectorizeCommand
  .command("delete")
  .description("Delete a vectorize index")
  .argument("<name>", "The name of the Vectorize index to delete.")
  .option("--force", "Force delete without confirmation")
  .option("-c, --config <path>", "Path to config file")
  .action(async (name, args) => {
    logger.log(`Deleting Vectorize index ${name}`);
    if (!args.force) {
      // const confirmedDeletion = await confirm(
      //   `OK to delete the index '${name}'?`
      // );
      // if (!confirmedDeletion) {
      //   logger.log("Deletion cancelled.");
      //   return;
      // }
    }

    await vectorize.deleteIndex({ config: args.config, indexName: name });
    logger.log(`✅ Deleted index ${name}`);
  });

vectorizeCommand
  .command("get")
  .description("Get a vectorize index by name")
  .argument("<name>", "The name of the Vectorize index to get.")
  .option("-c, --config <path>", "Path to config file")
  .option("--json", "Return output as clean JSON", false)
  .action(async (name, args) => {
    const indexResult = await vectorize.getIndex({
      config: args.config,
      indexName: name
    });

    // if (args.json) {
    logger.log(JSON.stringify(indexResult, null, 2));
    return;
    // }

    // logger.table([
    // 	{
    // 		name: index.name,
    // 		dimensions: index.config?.dimensions.toString(),
    // 		metric: index.config?.metric,
    // 		description: index.description || "",
    // 		created: index.created_on,
    // 		modified: index.modified_on,
    // 	},
    // ]);
  });

vectorizeCommand
  .command("list")
  .description("List all vectorize indexes")
  .option("-c, --config <path>", "Path to config file")
  .option("--json", "Return output as clean JSON", false)
  .action(async (args) => {
    logger.log(`📋 Listing Vectorize indexes...`);
    const indexes = await vectorize.listIndexes({ config: args.config });

    if (indexes.length === 0) {
      logger.warn(`
You haven't created any indexes on this account.

Use 'npx partykit vectorize create <name>' to create one, or visit
https://docs.partykit.io/vectorize/ to get started.
		`);
      return;
    }

    // if (args.json) {
    logger.log(JSON.stringify(indexes, null, 2));
    return;
    // }

    // logger.table(
    // 	indexes.map((index) => ({
    // 		name: index.name,
    // 		dimensions: index.config?.dimensions.toString(),
    // 		metric: index.config?.metric,
    // 		description: index.description ?? "",
    // 		created: index.created_on,
    // 		modified: index.modified_on,
    // 	}))
    // );
  });

const VECTORIZE_MAX_BATCH_SIZE = 1_000;
const VECTORIZE_UPSERT_BATCH_SIZE = VECTORIZE_MAX_BATCH_SIZE;
const VECTORIZE_MAX_UPSERT_VECTOR_RECORDS = 100_000;

// helper method that reads an ndjson file line by line in batches. not this doesn't
// actually do any parsing - that will be handled on the backend
// https://nodejs.org/docs/latest-v16.x/api/readline.html#rlsymbolasynciterator
async function* getBatchFromFile(
  rl: RLInterface,
  batchSize = VECTORIZE_UPSERT_BATCH_SIZE
) {
  let batch: string[] = [];
  for await (const line of rl) {
    if (batch.push(line) >= batchSize) {
      yield batch;
      batch = [];
    }
  }

  yield batch;
}

vectorizeCommand
  .command("insert")
  .description("Insert vectors into a Vectorize index")
  .argument("[name]", "The name of the Vectorize index to insert into.")
  .option(
    "--file <file>",
    "A file containing line separated json (ndjson) vector objects."
  )
  .addOption(
    new Option(
      "--batch-size <number>",
      "The number of vectors to insert per batch."
    ).default(VECTORIZE_UPSERT_BATCH_SIZE)
  )
  .option("--json", "Return output as clean JSON", false)
  .option("-c, --config <path>", "Path to config file")
  .action(async (name, args) => {
    const rl = createInterface({ input: createReadStream(args.file) });

    if (Number(args.batchSize) > VECTORIZE_MAX_BATCH_SIZE) {
      logger.error(
        `🚨 Vectorize currently limits upload batches to ${VECTORIZE_MAX_BATCH_SIZE} records at a time.`
      );
    }

    let vectorInsertCount = 0;
    for await (const batch of getBatchFromFile(rl, args.batchSize)) {
      const formData = new FormData();
      formData.append(
        "vectors",
        new File([batch.join(`\n`)], "vectors.ndjson", {
          type: "application/x-ndjson"
        })
      );
      logger.log(`✨ Uploading vector batch (${batch.length} vectors)`);
      const idxPart = await vectorize.insertIntoIndex({
        config: args.config,
        indexName: name,
        body: formData
      });
      vectorInsertCount += idxPart.count;

      if (vectorInsertCount > VECTORIZE_MAX_UPSERT_VECTOR_RECORDS) {
        logger.warn(
          `🚧 While Vectorize is in beta, we've limited uploads to 100k vectors per run. You may run this again with another batch to upload further`
        );
        break;
      }
    }

    if (args.json) {
      logger.log(
        JSON.stringify({ index: name, count: vectorInsertCount }, null, 2)
      );
      return;
    }

    logger.log(
      `✅ Successfully inserted ${vectorInsertCount} vectors into index '${name}'`
    );
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
