/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from "vitest";
import { Party } from "../client";

describe("client", () => {
  it("should throw without host", () => {
    expect(() => {
      // @ts-expect-error - we're testing the error case
      new Party();
    }).toThrowError("Party must be constructed with a host");
  });
});
