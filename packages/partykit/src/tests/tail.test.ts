import fs from "fs";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { tail } from "../cli";
import { clearMocks } from "./fetchResult-mock";

vi.mock("../fetchResult", async () => {
  const { fetchResult } = await import("./fetchResult-mock");
  return {
    fetchResult
  };
});

process.env.GITHUB_LOGIN = "test-user";
process.env.GITHUB_TOKEN = "test-token";

const currDir = process.cwd();

beforeEach(() => {
  clearMocks();
  // create a tmp dir
  const dirPath = fs.mkdtempSync("pk-test-env");
  // set the cwd to the tmp dir
  process.chdir(dirPath);
});

afterEach(() => {
  // switch back to the original dir
  const tmpDir = process.cwd();
  process.chdir(currDir);
  // remove the tmp dir
  fs.rmdirSync(tmpDir, { recursive: true });
});

describe("tail", () => {
  it("should error without a project name", async () => {
    await expect(
      tail({
        name: undefined,
        config: undefined,
        preview: undefined,
        format: "pretty",
        debug: false,
        status: [],
        header: undefined,
        samplingRate: undefined,
        method: [],
        ip: [],
        search: undefined
      })
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `[Error: Missing project name, please specify "name" in your config, or pass it in via the CLI with --name <name>]`
    );
  });

  // TODO: test websocket stuff? maybe overkill for now.
});
