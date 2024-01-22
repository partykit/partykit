import * as util from "node:util";

import { afterEach, beforeEach, vi } from "vitest";

import type { MockInstance } from "vitest";

/**
 * We use this module to mock console methods, and optionally
 * assert on the values they're called with in our tests.
 */

let debugSpy: MockInstance,
  logSpy: MockInstance,
  infoSpy: MockInstance,
  errorSpy: MockInstance,
  warnSpy: MockInstance;

const std = {
  get debug() {
    return normalizeOutput(debugSpy);
  },
  get out() {
    return normalizeOutput(logSpy);
  },
  get info() {
    return normalizeOutput(infoSpy);
  },
  get err() {
    return normalizeOutput(errorSpy);
  },
  get warn() {
    return normalizeOutput(warnSpy);
  }
};

function normalizeOutput(spy: MockInstance): string {
  return normalizeErrorMarkers(
    replaceByte(
      stripTrailingWhitespace(
        normalizeSlashes(normalizeTempDirs(stripTimings(captureCalls(spy))))
      )
    )
  );
}

function captureCalls(spy: MockInstance): string {
  return spy.mock.calls
    .map((args: unknown[]) => util.format("%s", ...args))
    .join("\n");
}

export function mockConsoleMethods() {
  beforeEach(() => {
    debugSpy = vi.spyOn(console, "debug");
    logSpy = vi.spyOn(console, "log");
    infoSpy = vi.spyOn(console, "info");
    errorSpy = vi.spyOn(console, "error");
    warnSpy = vi.spyOn(console, "warn");
  });
  afterEach(() => {
    debugSpy.mockRestore();
    logSpy.mockRestore();
    infoSpy.mockRestore();
    errorSpy.mockRestore();
    warnSpy.mockRestore();
  });
  return std;
}

/**
 * Normalize error `X` markers.
 *
 * Windows gets a different character.
 */
function normalizeErrorMarkers(str: string): string {
  return str.replaceAll("✘", "X");
}

/**
 * Ensure slashes in the `str` are OS file-system agnostic.
 *
 * Use this in snapshot tests to be resilient to file-system differences.
 */
export function normalizeSlashes(str: string): string {
  return str.replace(/\\/g, "/");
}

/**
 * Strip "timing data" out of the `stdout` string, since this is not always deterministic.
 *
 * Use this in snapshot tests to be resilient to slight changes in timing of processing.
 */
export function stripTimings(stdout: string): string {
  return stdout.replace(/\(\d+\.\d+ sec\)/g, "(TIMINGS)");
}

export function stripTrailingWhitespace(str: string): string {
  return str.replace(/[^\S\n]+\n/g, "\n");
}

/**
 * Removing leading kilobit (tenth of a byte) from test output due to
 * variation causing every few tests the value to change by ± .01
 */
function replaceByte(stdout: string): string {
  return stdout.replaceAll(/\d+\.\d+ KiB/g, "xx KiB");
}

/**
 * Temp directories are created with random names, so we replace all comments temp dirs in them
 */
export function normalizeTempDirs(stdout: string): string {
  return stdout.replaceAll(/\/\/.+\/tmp.+/g, "//tmpdir");
}
