import fs from "fs";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { deploy } from "../cli";
import { clearMocks, mockFetchResult } from "./fetchResult-mock";
import { mockConsoleMethods } from "./mock-console";

import type { StaticAssetsManifestType } from "../server";

const std = mockConsoleMethods();

vi.mock("../fetchResult", async () => {
  const { fetchResult } = await import("./fetchResult-mock");
  return {
    fetchResult
  };
});

const fixture = `${__dirname}/fixture.js`;

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

type DeployResponse = {
  result: {
    is_first_deploy: boolean;
  };
};

describe("deploy", () => {
  it("should error without a valid script", async () => {
    // @ts-expect-error we're purposely not passing a script path
    await expect(deploy({})).rejects.toThrowErrorMatchingInlineSnapshot(
      `[Error: Missing entry point, please specify "main" in your config, or pass it in via the CLI]`
    );
  });

  it("should error without a name", async () => {
    await expect(
      // @ts-expect-error we're purposely not passing a name
      deploy({ main: fixture })
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `[Error: Missing project name, please specify "name" in your config, or pass it in via the CLI with --name <name>]`
    );
  });

  it("should build and submit a script to the server", async () => {
    let checkedResponse = false;
    mockFetchResult<DeployResponse>(
      "POST",
      "/parties/test-user/test-script",
      (url, options) => {
        expect(url).toMatchInlineSnapshot('"/parties/test-user/test-script"');
        expect(options?.user?.access_token).toBe("test-token");
        checkedResponse = true;
        return {
          result: { is_first_deploy: false }
        };
      }
    );
    await deploy({
      main: fixture,
      name: "test-script",
      tailConsumers: undefined,
      config: undefined,
      vars: undefined,
      define: undefined,
      preview: undefined,
      withVars: undefined,
      serve: undefined,
      compatibilityDate: undefined,
      compatibilityFlags: undefined,
      minify: undefined,
      withEnv: undefined,
      domain: undefined
    });
    expect(checkedResponse).toBe(true);
  });

  it("should send cli vars without others from config", async () => {
    fs.writeFileSync(
      "partykit.json",
      JSON.stringify({
        name: "test-script",
        vars: {
          a: "a1",
          b: "b2",
          c: "c3",
          d: "d4"
        }
      })
    );

    let checkedResponse = false;
    mockFetchResult<DeployResponse>(
      "POST",
      "/parties/test-user/test-script",
      (url, options) => {
        expect(url).toMatchInlineSnapshot('"/parties/test-user/test-script"');
        expect(options?.user?.access_token).toBe("test-token");

        const form = options?.body as FormData;
        expect(form.get("vars")).toMatchInlineSnapshot(`"{"a":"b","c":"d"}"`);
        checkedResponse = true;
        return {
          result: { is_first_deploy: false }
        };
      }
    );
    await deploy({
      main: fixture,
      name: "test-script",
      config: undefined,
      vars: {
        a: "b",
        c: "d"
      },
      define: undefined,
      tailConsumers: undefined,
      preview: undefined,
      withVars: undefined,
      serve: undefined,
      compatibilityDate: undefined,
      compatibilityFlags: undefined,
      minify: undefined,
      withEnv: undefined,
      domain: undefined
    });
    expect(checkedResponse).toBe(true);
  });

  it("should send cli vars with config when specified", async () => {
    fs.writeFileSync(
      "partykit.json",
      JSON.stringify({
        name: "test-script",
        vars: {
          a: "a1",
          b: "b2",
          c: "c3",
          d: "d4"
        }
      })
    );

    let checkedResponse = false;
    mockFetchResult<DeployResponse>(
      "POST",
      "/parties/test-user/test-script",
      (url, options) => {
        expect(url).toMatchInlineSnapshot('"/parties/test-user/test-script"');
        expect(options?.user?.access_token).toBe("test-token");

        const form = options?.body as FormData;
        expect(form.get("vars")).toMatchInlineSnapshot(
          `"{"a":"b","b":"b2","c":"d","d":"d4"}"`
        );
        checkedResponse = true;
        return {
          result: { is_first_deploy: false }
        };
      }
    );
    await deploy({
      main: fixture,
      name: "test-script",
      config: undefined,
      vars: {
        a: "b",
        c: "d"
      },
      define: undefined,
      tailConsumers: undefined,
      preview: undefined,
      withVars: true,
      serve: undefined,
      compatibilityDate: undefined,
      compatibilityFlags: undefined,
      minify: undefined,
      withEnv: undefined,
      domain: undefined
    });
    expect(checkedResponse).toBe(true);
  });

  it("should error if the server returns an error", async () => {
    mockFetchResult(
      "POST",
      "/parties/test-user/test-script",
      (_url, _options) => {
        throw new Error("Not OK");
      }
    );
    await expect(
      deploy({
        main: fixture,
        name: "test-script",
        config: undefined,
        vars: undefined,
        define: undefined,
        preview: undefined,
        withVars: undefined,
        tailConsumers: undefined,
        serve: undefined,
        compatibilityDate: undefined,
        compatibilityFlags: undefined,
        minify: undefined,
        withEnv: undefined,
        domain: undefined
      })
    ).rejects.toThrowErrorMatchingInlineSnapshot(`[Error: Not OK]`);
  });

  it('should warn if using "serve" in the config', async () => {
    let checkedResponse = false;
    mockFetchResult<DeployResponse>(
      "POST",
      "/parties/test-user/test-script",
      (url, options) => {
        expect(url).toMatchInlineSnapshot('"/parties/test-user/test-script"');
        expect(options?.user?.access_token).toBe("test-token");

        checkedResponse = true;
        return {
          result: { is_first_deploy: false }
        };
      }
    );

    mockFetchResult<StaticAssetsManifestType>(
      "GET",
      "/parties/test-user/test-script/assets",
      (url, options) => {
        expect(url).toMatchInlineSnapshot(
          '"/parties/test-user/test-script/assets"'
        );
        expect(options?.headers).toMatchInlineSnapshot(`
          {
            "Content-Type": "application/json",
          }
        `);
        expect(options?.user?.access_token).toBe("test-token");

        return {
          devServer: "",
          browserTTL: undefined,
          edgeTTL: undefined,
          singlePageApp: false,
          assets: {},
          assetInfo: {}
        };
      }
    );

    mockFetchResult<null>(
      "POST",
      "/parties/test-user/test-script/assets",
      (url, options) => {
        expect(url).toMatchInlineSnapshot(
          '"/parties/test-user/test-script/assets"'
        );
        expect(options?.headers).toMatchInlineSnapshot(`
          {
            "Content-Type": "application/json",
          }
        `);
        expect(options?.user?.access_token).toBe("test-token");

        expect(options?.body).toMatchInlineSnapshot(
          '"{\\"devServer\\":\\"\\",\\"assets\\":{}}"'
        );
        return null;
      }
    );

    fs.writeFileSync(
      "partykit.json",
      JSON.stringify({
        name: "test-script",
        serve: "./public",
        compatibilityDate: "2023-09-28"
      })
    );

    fs.mkdirSync("public");

    await deploy({
      main: fixture,
      name: "test-script",
      config: undefined,
      vars: undefined,
      define: undefined,
      preview: undefined,
      withVars: undefined,
      tailConsumers: undefined,
      serve: undefined,
      compatibilityDate: undefined,
      compatibilityFlags: undefined,
      minify: undefined,
      withEnv: undefined,
      domain: undefined
    });

    expect(checkedResponse).toBe(true);

    expect(std.err).toEqual("");
    expect(std.out).toContain(
      "Deployed ./../packages/partykit/src/tests/fixture.js to https://test-script.test-user.partykit.dev"
    );
  });
});
