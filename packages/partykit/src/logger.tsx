// via https://github.com/cloudflare/workers-sdk/blob/ade600c4161dfa0bed9fd79d6ecfb4a926553c13/packages/wrangler/src/logger.ts
import { format } from "node:util";

import { formatMessagesSync } from "esbuild";

import type { BuildFailure } from "esbuild";

export class ConfigurationError extends Error {}

export const LOGGER_LEVELS = {
  none: -1,
  error: 0,
  warn: 1,
  info: 2,
  log: 3,
  debug: 4
} as const;

export type LoggerLevel = keyof typeof LOGGER_LEVELS;

/** A map from LOGGER_LEVEL to the error `kind` needed by `formatMessagesSync()`. */
const LOGGER_LEVEL_FORMAT_TYPE_MAP = {
  error: "error",
  warn: "warning",
  info: undefined,
  log: undefined,
  debug: undefined
} as const;

function getLogLevelFromEnv(): string | undefined {
  return process.env.PARTYKIT_LOG;
}

function getLoggerLevel(): LoggerLevel {
  const fromEnv = getLogLevelFromEnv()?.toLowerCase();
  if (fromEnv !== undefined) {
    if (fromEnv in LOGGER_LEVELS) return fromEnv as LoggerLevel;
    const expected = Object.keys(LOGGER_LEVELS)
      .map((level) => `"${level}"`)
      .join(" | ");
    console.warn(
      `Unrecognised PARTYKIT_LOG value ${JSON.stringify(
        fromEnv
      )}, expected ${expected}, defaulting to "log"...`
    );
  }
  return "log";
}

// export type TableRow<Keys extends string> = Record<Keys, string>;

export class Logger {
  constructor() {}

  loggerLevel = getLoggerLevel();
  columns = process.stdout.columns;

  debug = (...args: unknown[]) => this.doLog("debug", args);
  info = (...args: unknown[]) => this.doLog("info", args);
  log = (...args: unknown[]) => this.doLog("log", args);
  warn = (...args: unknown[]) => this.doLog("warn", args);
  error = (...args: unknown[]) => this.doLog("error", args);
  // table<Keys extends string>(data: TableRow<Keys>[]) {
  // 	const keys: Keys[] =
  // 		data.length === 0 ? [] : (Object.keys(data[0]) as Keys[]);
  // 	const t = new CLITable({
  // 		head: keys,
  // 		style: {
  // 			head: chalk.level ? ["blue"] : [],
  // 			border: chalk.level ? ["gray"] : [],
  // 		},
  // 	});
  // 	t.push(...data.map((row) => keys.map((k) => row[k])));
  // 	return this.doLog("log", [t.toString()]);
  // }

  private doLog(messageLevel: Exclude<LoggerLevel, "none">, args: unknown[]) {
    if (LOGGER_LEVELS[this.loggerLevel] >= LOGGER_LEVELS[messageLevel]) {
      console[messageLevel](this.formatMessage(messageLevel, format(...args)));
    }
  }

  private formatMessage(
    level: Exclude<LoggerLevel, "none">,
    message: string
  ): string {
    const kind = LOGGER_LEVEL_FORMAT_TYPE_MAP[level];
    if (kind) {
      // Format the message using the esbuild formatter.
      // The first line of the message is the main `text`,
      // subsequent lines are put into the `notes`.
      const [firstLine, ...otherLines] = message.split("\n");
      const notes =
        otherLines.length > 0
          ? otherLines.map((text) => ({ text }))
          : undefined;
      return formatMessagesSync([{ text: firstLine, notes }], {
        color: true,
        kind,
        terminalWidth: this.columns
      })[0];
    } else {
      return message;
    }
  }
}

/**
 * A drop-in replacement for `console` for outputting logging messages.
 *
 * Errors and Warnings will get additional formatting to highlight them to the user.
 * You can also set a `logger.loggerLevel` value to one of "debug", "log", "warn" or "error",
 * to filter out logging messages.
 */
export const logger = new Logger();

/**
 * Logs all errors/warnings associated with an esbuild BuildFailure in the same
 * style esbuild would.
 */
export function logBuildFailure(failure: BuildFailure) {
  let logs = formatMessagesSync(failure.errors, { kind: "error", color: true });
  for (const log of logs) console.error(log);
  logs = formatMessagesSync(failure.warnings, { kind: "warning", color: true });
  for (const log of logs) console.warn(log);
}
