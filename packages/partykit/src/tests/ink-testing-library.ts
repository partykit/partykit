// This is a fork of ink-testing-library
// until https://github.com/vadimdemedes/ink-testing-library/pull/23 is merged

import { EventEmitter } from "node:events";

import type { ReactElement } from "react";
import { render as inkRender } from "ink";

import type { Instance as InkInstance } from "ink";

class Stdout extends EventEmitter {
  get columns() {
    return 100;
  }

  readonly frames: string[] = [];
  private _lastFrame?: string;

  write = (frame: string) => {
    this.frames.push(frame);
    this._lastFrame = frame;
  };

  lastFrame = () => this._lastFrame;
}

class Stderr extends EventEmitter {
  readonly frames: string[] = [];
  private _lastFrame?: string;

  write = (frame: string) => {
    this.frames.push(frame);
    this._lastFrame = frame;
  };

  lastFrame = () => this._lastFrame;
}

class Stdin extends EventEmitter {
  isTTY = true;

  write = (data: string) => {
    this.emit("data", data);
  };

  setEncoding() {
    // Do nothing
  }

  setRawMode() {
    // Do nothing
  }

  resume() {
    // Do nothing
  }

  pause() {
    // Do nothing
  }

  ref() {
    // Do nothing
  }

  unref() {
    // Do nothing
  }
}

type Instance = {
  rerender: (tree: ReactElement) => void;
  unmount: () => void;
  cleanup: () => void;
  stdout: Stdout;
  stderr: Stderr;
  stdin: Stdin;
  frames: string[];
  lastFrame: () => string | undefined;
};

const instances: InkInstance[] = [];

export const render = (tree: ReactElement): Instance => {
  const stdout = new Stdout();
  const stderr = new Stderr();
  const stdin = new Stdin();

  const instance = inkRender(tree, {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    stdout: stdout as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    stderr: stderr as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    stdin: stdin as any,
    debug: true,
    exitOnCtrlC: false,
    patchConsole: false
  });

  instances.push(instance);

  return {
    rerender: instance.rerender,
    unmount: instance.unmount,
    cleanup: instance.cleanup,
    stdout,
    stderr,
    stdin,
    frames: stdout.frames,
    lastFrame: stdout.lastFrame
  };
};

export const cleanup = () => {
  for (const instance of instances) {
    instance.unmount();
    instance.cleanup();
  }
};
