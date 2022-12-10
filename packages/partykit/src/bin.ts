#!/usr/bin/env node --enable-source-maps
import { runPartykit } from "./cli";
import { version } from "../package.json";
import { program } from "commander";

// process.on("SIGINT", () => {
//   console.log("Interrupted");
//   process.exit(0);
// });

// process.on("SIGTERM", () => {
//   console.log("Terminated");
//   process.exit(0);
// });

// process.on("exit", (code) => {
//   console.log(`About to exit with code: ${code}`);
// });

// process.on("uncaughtExceptionMonitor", function (err) {
//   console.error("uncaught exception", err);
//   throw err;
// });

// process.on("unhandledRejection", function (reason, promise) {
//   console.log("Unhandled Rejection at:", promise, "reason:", reason);
// });

program
  .version(version, "-v, --version", "output the current version")
  .description("Run a partykit script")
  .argument("<script>", "path to the script to run")
  .option("-p, --port", "port to run the server on");

program.parse(process.argv);

const scriptPath = program.args[0];
runPartykit(scriptPath);
