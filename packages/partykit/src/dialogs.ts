import chalk from "chalk";
import prompts from "prompts";

import { UserError } from "./cf-auth/parse";
import { CI } from "./is-ci";
import isInteractive from "./is-interactive";
import { logger } from "./logger";

// TODO: Use this function across the codebase.
function isNonInteractiveOrCI(): boolean {
  return !isInteractive() || CI.isCI();
}

export class NoDefaultValueProvided extends UserError {
  constructor() {
    // This is user-facing, so make the message something understandable
    // It _should_ always be caught and replaced with a more descriptive error
    // but this is fine as a fallback.
    super("This command cannot be run in a non-interactive context");
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

interface ConfirmOptions {
  defaultValue?: boolean;
  fallbackValue?: boolean;
}

export async function confirm(
  text: string,
  { defaultValue = true, fallbackValue = true }: ConfirmOptions = {}
): Promise<boolean> {
  if (isNonInteractiveOrCI()) {
    logger.log(`? ${text}`);
    logger.log(
      `🤖 ${chalk.dim(
        "Using fallback value in non-interactive context:"
      )} ${chalk.white.bold(fallbackValue ? "yes" : "no")}`
    );
    return fallbackValue;
  }
  const { value } = await prompts({
    type: "confirm",
    name: "value",
    message: text,
    initial: defaultValue,
    onState: (state) => {
      if (state.aborted) {
        process.nextTick(() => {
          process.exit(1);
        });
      }
    }
  });
  return value as boolean;
}

interface PromptOptions {
  defaultValue?: string;
  isSecret?: boolean;
}

export async function prompt(
  text: string,
  options: PromptOptions = {}
): Promise<string> {
  if (isNonInteractiveOrCI()) {
    if (options?.defaultValue === undefined) {
      throw new NoDefaultValueProvided();
    }
    logger.log(`? ${text}`);
    logger.log(
      `🤖 ${chalk.dim(
        "Using default value in non-interactive context:"
      )} ${chalk.white.bold(options.defaultValue)}`
    );
    return options.defaultValue;
  }
  const { value } = await prompts({
    type: "text",
    name: "value",
    message: text,
    initial: options?.defaultValue,
    style: options?.isSecret ? "password" : "default",
    onState: (state) => {
      if (state.aborted) {
        process.nextTick(() => {
          process.exit(1);
        });
      }
    }
  });
  return value as string;
}

interface SelectOptions<Values> {
  choices: SelectOption<Values>[];
  defaultOption?: number;
}

interface SelectOption<Values> {
  title: string;
  description?: string;
  value: Values;
}

export async function select<Values extends string>(
  text: string,
  options: SelectOptions<Values>
): Promise<Values> {
  if (isNonInteractiveOrCI()) {
    if (options?.defaultOption === undefined) {
      throw new NoDefaultValueProvided();
    }
    logger.log(`? ${text}`);
    logger.log(
      `🤖 ${chalk.dim(
        "Using default value in non-interactive context:"
      )} ${chalk.white.bold(options.choices[options.defaultOption].title)}`
    );
    return options.choices[options.defaultOption].value;
  }

  const { value } = await prompts({
    type: "select",
    name: "value",
    message: text,
    choices: options.choices,
    initial: options.defaultOption,
    onState: (state) => {
      if (state.aborted) {
        process.nextTick(() => {
          process.exit(1);
        });
      }
    }
  });
  return value as Values;
}
