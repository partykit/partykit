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
    await expect(deploy()).rejects.toThrowErrorMatchingInlineSnapshot(
      '"script path is missing"'
    );
  });

  it("should error without a name", async () => {
    await expect(
      // @ts-expect-error we're purposely not passing a name
      deploy(fixture, {})
    ).rejects.toThrowErrorMatchingInlineSnapshot('"name is missing"');
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
    await deploy(fixture, {
      name: "test-script",
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
      deploy(fixture, {
        name: "test-script",
      })
    ).rejects.toThrowErrorMatchingInlineSnapshot('"Not OK"');
  });
});
