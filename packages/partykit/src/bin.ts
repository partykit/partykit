#!/usr/bin/env node --enable-source-maps
import * as cli from "./cli";
import { version } from "../package.json";
import { program } from "commander";

process.on("SIGINT", () => {
  console.log("Interrupted");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("Terminated");
  process.exit(0);
});

process.on("exit", (code) => {
  // console.log(`About to exit with code: ${code}`);
});

process.on("uncaughtExceptionMonitor", function (err) {
  // console.error("uncaught exception", err);
  throw err;
});

process.on("unhandledRejection", function (reason, promise) {
  // console.error("Unhandled Rejection at:", promise, "reason:", reason);
  throw reason;
});

program
  .name("partykit")
  .version(version, "-v, --version", "output the current version")
  .description("Run a partykit script");

program
  .command("dev")
  .argument("<script>", "path to the script to run")
  .option("-p, --port", "port to run the server on")
  .action((scriptPath, options) => {
    cli.dev(scriptPath, { port: options.port });
  });

program
  .command("publish")
  .argument("<script>", "path to the script to publish")
  .option("-n, --name <name>", "name of the script")
  .action((scriptPath, options) => {
    cli.publish(scriptPath, { name: options.name });
  });

program
  .command("delete")
  .option("-n, --name <name>", "name of the script")
  .action((options) => {
    cli._delete({ name: options.name });
  });

program
  .command("login")
  .description("login to partykit")
  .action(() => {
    cli.login();
  });

program
  .command("logout")
  .description("logout of partykit")
  .action(() => {
    cli.logout();
  });

program.parse(process.argv);
