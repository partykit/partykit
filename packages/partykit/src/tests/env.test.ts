import fs from "fs";
import { env } from "../cli";
import { vi, beforeEach, expect, describe, test, afterEach } from "vitest";
import { mockConsoleMethods } from "./mock-console";
import { mockFetchResult, clearMocks } from "./fetchResult-mock";

vi.mock("../fetchResult", async () => {
  const { fetchResult } = await import("./fetchResult-mock");
  return {
    fetchResult,
  };
});

process.env.GITHUB_LOGIN = "test-user";
process.env.GITHUB_TOKEN = "test-token";

const std = mockConsoleMethods();

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

describe("env", () => {
  test("list", async () => {
    let checkedResponse = false;
    mockFetchResult(
      "GET",
      `/parties/test-user/my-project/env?keys=true`,
      (_url, _options) => {
        checkedResponse = true;
        return ["a", "b", "c", "d"];
      }
    );

    await env.list({
      name: "my-project",
      config: undefined,
      preview: undefined,
    });
    expect(checkedResponse).toBe(true);
    expect(std).toMatchInlineSnapshot(`
        {
          "debug": "",
          "err": "",
          "info": "",
          "out": "[ 'a', 'b', 'c', 'd' ]",
          "warn": "",
        }
      `);
  });

  test("pull", async () => {
    let checkedResponse = false;
    mockFetchResult(
      "GET",
      `/parties/test-user/my-project/env`,
      (_url, _options) => {
        checkedResponse = true;
        return {
          a: "a1",
          b: "b2",
          c: "c3",
          d: "d4",
        };
      }
    );

    await env.pull(undefined, {
      name: "my-project",
      config: undefined,
      preview: undefined,
    });

    expect(checkedResponse).toBe(true);
    expect(std).toMatchInlineSnapshot(`
      {
        "debug": "",
        "err": "",
        "info": "",
        "out": "Creating partykit.json...",
        "warn": "",
      }
    `);
    expect(fs.existsSync("partykit.json")).toBe(true);
    expect(fs.readFileSync("partykit.json", "utf-8")).toMatchInlineSnapshot(`
      "{
        \\"name\\": \\"my-project\\",
        \\"vars\\": {
          \\"a\\": \\"a1\\",
          \\"b\\": \\"b2\\",
          \\"c\\": \\"c3\\",
          \\"d\\": \\"d4\\"
        }
      }
      "
    `);
  });

  describe("push", () => {
    test("push with no config", async () => {
      await env.push({
        name: "my-project",
        config: undefined,
        preview: undefined,
      });

      expect(std).toMatchInlineSnapshot(`
        {
          "debug": "",
          "err": "",
          "info": "",
          "out": "",
          "warn": "No environment variables to push, exiting...",
        }
      `);
    });

    test("push with config", async () => {
      fs.writeFileSync(
        "partykit.json",
        JSON.stringify({
          name: "my-project",
          vars: {
            a: "a1",
            b: "b2",
            c: "c3",
            d: "d4",
          },
        })
      );

      let checkedResponse = false;
      mockFetchResult(
        "POST",
        `/parties/test-user/my-project/env`,
        (_url, options) => {
          expect(JSON.parse(options?.body as string)).toMatchInlineSnapshot(`
            {
              "a": "a1",
              "b": "b2",
              "c": "c3",
              "d": "d4",
            }
          `);
          checkedResponse = true;
          return {
            success: true,
          };
        }
      );

      await env.push({
        name: "my-project",
        config: undefined,
        preview: undefined,
      });

      expect(checkedResponse).toBe(true);
      expect(std).toMatchInlineSnapshot(`
        {
          "debug": "",
          "err": "",
          "info": "",
          "out": "Pushed environment variables",
          "warn": "",
        }
      `);
    });
  });

  // skipping this one so we can figure out how to mock prompts
  test.skip("add", async () => {
    let checkedResponse = false;
    mockFetchResult(
      "POST",
      `/parties/test-user/my-project/env`,
      (_url, _options) => {
        checkedResponse = true;
        return {
          success: true,
        };
      }
    );

    await env.add("key", {
      name: "my-project",
      config: undefined,
      preview: undefined,
    });

    expect(checkedResponse).toBe(true);
    expect(std).toMatchInlineSnapshot();
  });

  test("remove", async () => {
    let checkedResponse = false;
    mockFetchResult(
      "DELETE",
      `/parties/test-user/my-project/env/some-key`,
      (_url, _options) => {
        checkedResponse = true;
        return {
          success: true,
        };
      }
    );

    await env.remove("some-key", {
      name: "my-project",
      config: undefined,
      preview: undefined,
    });

    expect(checkedResponse).toBe(true);
    expect(std).toMatchInlineSnapshot(`
      {
        "debug": "",
        "err": "",
        "info": "",
        "out": "{ success: true }",
        "warn": "",
      }
    `);
  });
});
