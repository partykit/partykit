import { describe, it, expect, beforeEach, vi } from "vitest";
import { deploy } from "../cli";
import { mockFetchResult, clearMocks } from "./fetchResult-mock";

vi.mock("../fetchResult", async () => {
  const { fetchResult } = await import("./fetchResult-mock");
  return {
    fetchResult,
  };
});

const fixture = `${__dirname}/fixture.js`;

process.env.GITHUB_LOGIN = "test-user";
process.env.GITHUB_TOKEN = "test-token";

describe("deploy", () => {
  beforeEach(() => {
    clearMocks();
  });
  it("should error without a valid script", async () => {
    // @ts-expect-error we're purposely not passing a script path
    await expect(deploy({})).rejects.toThrowErrorMatchingInlineSnapshot(
      '"Missing entry point, please specify \\"main\\" in your config"'
    );
  });

  it("should error without a name", async () => {
    await expect(
      // @ts-expect-error we're purposely not passing a name
      deploy({ main: fixture })
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      '"Missing project name, please specify \\"name\\" in your config"'
    );
  });

  it("should build and submit a script to the server", async () => {
    let checkedResponse = false;
    mockFetchResult<null>(
      "POST",
      "/parties/test-user/test-script",
      (url, options) => {
        expect(url).toMatchInlineSnapshot('"/parties/test-user/test-script"');
        expect(options?.headers).toMatchInlineSnapshot(`
          {
            "Authorization": "Bearer test-token",
            "X-PartyKit-User-Type": "github",
          }
        `);
        checkedResponse = true;
        return null;
      }
    );
    await deploy({
      main: fixture,
      name: "test-script",
      config: undefined,
      vars: undefined,
      define: undefined,
      preview: undefined,
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
      })
    ).rejects.toThrowErrorMatchingInlineSnapshot('"Not OK"');
  });
});
