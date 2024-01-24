import * as fs from "fs";
import { resolve } from "node:path";

import TOML from "@iarna/toml";

type File = {
  file?: string;
  fileText?: string;
};

type Location = File & {
  line: number;
  column: number;
  length?: number;
  lineText?: string;
  suggestion?: string;
};

type Message = {
  text: string;
  location?: Location;
  notes?: Message[];
  kind?: "warning" | "error";
};

type TomlError = Error & {
  line: number;
  col: number;
};

export class UserError extends Error {
  constructor(...args: ConstructorParameters<typeof Error>) {
    super(...args);
    // Restore prototype chain:
    // https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-2.html#support-for-newtarget
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * An error that's thrown when something fails to parse.
 */
export class ParseError extends UserError implements Message {
  readonly text: string;
  readonly notes: Message[];
  readonly location?: Location;
  readonly kind: "warning" | "error";

  constructor({ text, notes, location, kind }: Message) {
    super(text);
    this.name = this.constructor.name;
    this.text = text;
    this.notes = notes ?? [];
    this.location = location;
    this.kind = kind ?? "error";
  }
}

const TOML_ERROR_NAME = "TomlError";
const TOML_ERROR_SUFFIX = " at row ";

export function parseTOML(input: string, file?: string): TOML.JsonMap | never {
  try {
    // Normalize CRLF to LF to avoid hitting https://github.com/iarna/iarna-toml/issues/33.
    const normalizedInput = input.replace(/\r\n/g, "\n");
    return TOML.parse(normalizedInput);
  } catch (err) {
    const { name, message, line, col } = err as TomlError;
    if (name !== TOML_ERROR_NAME) {
      throw err;
    }
    const text = message.substring(0, message.lastIndexOf(TOML_ERROR_SUFFIX));
    const lineText = input.split("\n")[line];
    const location = {
      lineText,
      line: line + 1,
      column: col - 1,
      file,
      fileText: input
    };
    throw new ParseError({ text, location });
  }
}

/**
 * Reads a file and parses it based on its type.
 */
export function readFileSync(file: string): string {
  try {
    return fs.readFileSync(file, { encoding: "utf-8" });
  } catch (err) {
    const { message } = err as Error;
    throw new ParseError({
      text: `Could not read file: ${file}`,
      notes: [
        {
          text: message.replace(file, resolve(file))
        }
      ]
    });
  }
}
