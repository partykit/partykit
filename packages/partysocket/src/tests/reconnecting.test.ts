/**
 * @vitest-environment jsdom
 */

/* eslint-disable @typescript-eslint/ban-ts-comment, @typescript-eslint/no-explicit-any */
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  expect,
  test,
  vitest
} from "vitest";
import NodeWebSocket from "ws";

import ReconnectingWebSocket from "../ws";

import type { ErrorEvent } from "../ws";

const WebSocketServer = NodeWebSocket.Server;

const PORT = 50123;
const URL = `ws://localhost:${PORT}/`;
const ERROR_URL = "ws://255.255.255.255";

let wss: NodeWebSocket.Server<typeof NodeWebSocket.WebSocket>;
const originalWebSocket = global.WebSocket;

beforeAll(() => {
  wss = new WebSocketServer({ port: PORT });
});

beforeEach(() => {
  (global as any).WebSocket = originalWebSocket;
});

afterEach(() => {
  vitest.restoreAllMocks();
});

afterAll(() => {
  return new Promise((resolve) => {
    wss.clients.forEach((client) => {
      client.terminate();
    });
    wss.close(() => {
      resolve();
    });
  });
});

// test("throws with invalid constructor", () => {
//   delete (global as any).WebSocket;
//   expect(() => {
//     new ReconnectingWebSocket(URL, undefined, {
//       // @ts-expect-error we're purposefully passing an invalid constructor
//       WebSocket: 123,
//       maxRetries: 0,
//     });
//   }).toThrow();
// });

// test("throws with missing constructor", () => {
//   delete (global as any).WebSocket;
//   expect(() => {
//     new ReconnectingWebSocket(URL, undefined, { maxRetries: 0 });
//   }).toThrow();
// });

// test("throws with non-constructor object", () => {
//   (global as any).WebSocket = {};
//   expect(() => {
//     new ReconnectingWebSocket(URL, undefined, { maxRetries: 0 });
//   }).toThrow();
// });

test("throws if not created with `new`", () => {
  expect(() => {
    // @ts-ignore
    ReconnectingWebSocket(URL, undefined);
  }).toThrow(TypeError);
});

function toPromise(
  fn: (resolve: () => void, reject: (e: unknown) => void) => void
) {
  return () =>
    new Promise<void>((resolve, reject) => {
      fn(resolve, reject);
    });
}

function testDone(
  name: string,
  fn: (resolve: () => void, reject: (e: unknown) => void) => void
) {
  test(name, toPromise(fn));
}

testDone("global WebSocket is used if available", (done) => {
  // @ts-ignore
  const ws = new ReconnectingWebSocket(ERROR_URL, undefined, { maxRetries: 0 });
  ws.onerror = () => {
    // @ts-ignore
    expect(ws._ws instanceof WebSocket).toBeTruthy();
    done();
  };
});

testDone("getters when not ready", (done) => {
  const ws = new ReconnectingWebSocket(ERROR_URL, undefined, {
    maxRetries: 0
  });
  expect(ws.bufferedAmount).toBe(0);
  expect(ws.protocol).toBe("");
  expect(ws.url).toBe("");
  expect(ws.extensions).toBe("");
  expect(ws.binaryType).toBe("blob");

  ws.onerror = () => {
    done();
  };
});

testDone("debug on", (done) => {
  const logSpy = vitest.spyOn(console, "log").mockReturnValue();

  const ws = new ReconnectingWebSocket(ERROR_URL, undefined, {
    maxRetries: 0,
    debug: true
  });

  ws.onerror = () => {
    expect(logSpy).toHaveBeenCalledWith("RWS>", "connect", 0);
    done();
  };
});

testDone("debug off", (done) => {
  const logSpy = vitest.spyOn(console, "log").mockReturnValue();

  const ws = new ReconnectingWebSocket(ERROR_URL, undefined, { maxRetries: 0 });

  ws.onerror = () => {
    expect(logSpy).not.toHaveBeenCalled();
    done();
  };
});

// testDone("pass WebSocket via options", (done) => {
//   delete (global as any).WebSocket;
//   const ws = new ReconnectingWebSocket(URL, undefined, {
//     WebSocket,
//     maxRetries: 0,
//   });
//   ws.onerror = () => {
//     // @ts-ignore - accessing private property
//     expect(ws._ws instanceof WebSocket).toBe(true);
//     done();
//   };
// });

test("URL provider", async () => {
  const url = "example.com";
  const ws = new ReconnectingWebSocket(URL, undefined, { maxRetries: 0 });

  // @ts-ignore - accessing private property
  expect(await ws._getNextUrl(url)).toBe(url);

  // @ts-ignore - accessing private property
  expect(await ws._getNextUrl(() => url)).toBe(url);

  // @ts-ignore - accessing private property
  expect(await ws._getNextUrl(() => Promise.resolve(url))).toBe(url);

  // @ts-ignore - accessing private property
  expect(() => ws._getNextUrl(123)).toThrow();

  // @ts-ignore - accessing private property
  expect(() => ws._getNextUrl(() => 123)).toThrow();
});

testDone("websocket protocol", (done) => {
  const anyProtocol = "foobar";
  const ws = new ReconnectingWebSocket(URL, anyProtocol);

  ws.addEventListener("open", () => {
    expect(ws.url).toBe(URL);
    expect(ws.protocol).toBe(anyProtocol);
    ws.close();
  });

  ws.addEventListener("close", () => {
    done();
  });
});

testDone("undefined websocket protocol", (done) => {
  const ws = new ReconnectingWebSocket(URL, undefined, {});

  ws.addEventListener("open", () => {
    expect(ws.url).toBe(URL);
    expect(ws.protocol).toBe("");
    ws.close();
  });

  ws.addEventListener("close", () => {
    done();
  });
});

testDone("null websocket protocol", (done) => {
  // @ts-ignore - null is not allowed but could be passed in vanilla js
  const ws = new ReconnectingWebSocket(URL, null, {});
  ws.addEventListener("open", () => {
    expect(ws.url).toBe(URL);
    expect(ws.protocol).toBe("");
    ws.close();
  });

  ws.addEventListener("close", () => {
    done();
  });
});

test("websocket invalid protocolsProvider", () => {
  const ws = new ReconnectingWebSocket("ws://example.com", "foo", {});

  // @ts-ignore - accessing private property
  expect(() => ws._getNextProtocols(() => /Hahaha/)).toThrow();
});

testDone("websocket sync protocolsProvider", (done) => {
  const anyProtocol = "bar";

  const ws = new ReconnectingWebSocket(URL, () => anyProtocol, {});
  ws.addEventListener("open", () => {
    expect(ws.url).toBe(URL);
    expect(ws.protocol).toBe(anyProtocol);
    ws.close();
  });

  ws.addEventListener("close", () => {
    done();
  });
});

testDone("websocket async protocolsProvider", (done) => {
  const anyProtocol = "foo";

  const ws = new ReconnectingWebSocket(URL, async () => anyProtocol, {});
  ws.addEventListener("open", () => {
    expect(ws.url).toBe(URL);
    expect(ws.protocol).toBe(anyProtocol);
    ws.close();
  });

  ws.addEventListener("close", () => {
    done();
  });
});

test("connection status constants", () => {
  const ws = new ReconnectingWebSocket(URL, undefined, { maxRetries: 0 });

  expect(ReconnectingWebSocket.CONNECTING).toBe(0);
  expect(ReconnectingWebSocket.OPEN).toBe(1);
  expect(ReconnectingWebSocket.CLOSING).toBe(2);
  expect(ReconnectingWebSocket.CLOSED).toBe(3);

  expect(ws.CONNECTING).toBe(0);
  expect(ws.OPEN).toBe(1);
  expect(ws.CLOSING).toBe(2);
  expect(ws.CLOSED).toBe(3);
  ws.close();
});

const maxRetriesTest = (count: number, done: () => void) => {
  const ws = new ReconnectingWebSocket("ws://foo", undefined, {
    maxRetries: count,
    maxReconnectionDelay: 200
  });

  ws.addEventListener("error", () => {
    if (ws.retryCount === count) {
      setTimeout(done, 100);
    }
    if (ws.retryCount > count) {
      throw Error(`too many retries: ${ws.retryCount}`);
    }
  });
};

testDone("max retries: 0", (done) => maxRetriesTest(0, done));
testDone("max retries: 1", (done) => maxRetriesTest(1, done));
testDone("max retries: 5", (done) => maxRetriesTest(5, done));

testDone("level0 event listeners are kept after reconnect", (done) => {
  const ws = new ReconnectingWebSocket(ERROR_URL, undefined, {
    maxRetries: 4,
    reconnectionDelayGrowFactor: 1.2,
    maxReconnectionDelay: 20,
    minReconnectionDelay: 10
  });

  const handleOpen = () => undefined;
  const handleClose = () => undefined;
  const handleMessage = () => undefined;
  const handleError = () => {
    expect(ws.onopen).toBe(handleOpen);
    expect(ws.onclose).toBe(handleClose);
    expect(ws.onmessage).toBe(handleMessage);
    expect(ws.onerror).toBe(handleError);

    if (ws.retryCount === 4) {
      done();
    }
  };

  ws.onopen = handleOpen;
  ws.onclose = handleClose;
  ws.onmessage = handleMessage;
  ws.onerror = handleError;
});

testDone("level2 event listeners", (done) => {
  const anyProtocol = "foobar";
  const ws = new ReconnectingWebSocket(URL, anyProtocol, {});

  ws.addEventListener("open", () => {
    expect(ws.protocol).toBe(anyProtocol);
    expect(ws.extensions).toBe("");
    expect(ws.bufferedAmount).toBe(0);
    ws.close();
    done();
  });

  const fail = () => {
    throw Error("fail");
  };
  // @ts-ignore
  ws.addEventListener("unknown1", fail);
  ws.addEventListener("open", fail);
  ws.addEventListener("open", fail);
  ws.removeEventListener("open", fail);
  // @ts-ignore
  ws.removeEventListener("unknown2", fail);
});

// https://developer.mozilla.org/en-US/docs/Web/API/EventListener/handleEvent
testDone("level2 event listeners using object with handleEvent", (done) => {
  const anyProtocol = "foobar";
  const ws = new ReconnectingWebSocket(URL, anyProtocol, {});

  ws.addEventListener("open", {
    // @ts-ignore
    handleEvent: () => {
      expect(ws.protocol).toBe(anyProtocol);
      expect(ws.extensions).toBe("");
      expect(ws.bufferedAmount).toBe(0);
      ws.close();
      done();
    }
  });

  const fail = {
    handleEvent: () => {
      throw Error("fail");
    }
  };
  // @ts-ignore
  ws.addEventListener("unknown1", fail);
  // @ts-ignore
  ws.addEventListener("open", fail);
  // @ts-ignore
  ws.addEventListener("open", fail);
  // @ts-ignore
  ws.removeEventListener("open", fail);
  // @ts-ignore
  ws.removeEventListener("unknown2", fail);
});

// testDone("connection timeout", (done) => {
//   const proc = spawn("node", [
//     `${__dirname}/unresponsive-server.js`,
//     PORT_UNRESPONSIVE,
//     "5000",
//   ]);

//   let lock = false;
//   proc.stdout.on("data", () => {
//     if (lock) return;
//     lock = true;

//     const ws = new ReconnectingWebSocket(
//       `ws://localhost:${PORT_UNRESPONSIVE}`,
//       undefined,
//       {
//         minReconnectionDelay: 50,
//         connectionTimeout: 500,
//         maxRetries: 1,
//       }
//     );

//     ws.addEventListener("error", (event) => {
//       expect(event.message).toBe("TIMEOUT");
//       if (ws.retryCount === 1) {
//         setTimeout(() => done(), 1000);
//       }
//     });
//   });
// });

testDone("getters", (done) => {
  const anyProtocol = "foobar";
  const ws = new ReconnectingWebSocket(URL, anyProtocol, {
    maxReconnectionDelay: 100
  });

  ws.addEventListener("open", () => {
    expect(ws.protocol).toBe(anyProtocol);
    expect(ws.extensions).toBe("");
    expect(ws.bufferedAmount).toBe(0);
    expect(ws.binaryType).toBe("blob");
    ws.close();
    done();
  });
});

testDone("binaryType", (done) => {
  const ws = new ReconnectingWebSocket(URL, undefined, {
    minReconnectionDelay: 0
  });

  expect(ws.binaryType).toBe("blob");
  ws.binaryType = "arraybuffer";
  ws.addEventListener("open", () => {
    expect(ws.binaryType).toBe("arraybuffer");
    // @ts-ignore
    ws.binaryType = "blob";
    expect(ws.binaryType).toBe("blob");
    ws.close();
    done();
  });
});

testDone("calling to close multiple times", (done) => {
  const ws = new ReconnectingWebSocket(URL, undefined, {});

  ws.addEventListener("open", () => {
    ws.close();
    ws.close();
    ws.close();
  });

  let calls = 0;
  ws.addEventListener("close", () => {
    calls++;
  });

  setTimeout(() => {
    expect(calls).toBe(1);
    done();
  }, 100);
});

testDone("calling to reconnect when not ready", (done) => {
  const ws = new ReconnectingWebSocket(URL, undefined, {});
  ws.reconnect();
  ws.reconnect();

  ws.addEventListener("open", () => {
    ws.close();
  });

  ws.addEventListener("close", () => {
    done();
  });
});

testDone("start closed", (done, fail) => {
  const anyMessageText = "hello";
  const anyProtocol = "foobar";

  wss.once("connection", (ws) => {
    void ws.once("message", (msg) => {
      ws.send(msg);
    });
  });

  wss.once("error", (e) => {
    fail(e);
  });

  expect.assertions(10);

  const ws = new ReconnectingWebSocket(URL, anyProtocol, {
    minReconnectionDelay: 100,
    maxReconnectionDelay: 200,
    startClosed: true
  });

  expect(ws.readyState).toBe(ws.CLOSED);

  setTimeout(() => {
    expect(ws.readyState).toBe(ws.CLOSED);

    ws.reconnect();

    ws.addEventListener("open", () => {
      expect(ws.protocol).toBe(anyProtocol);
      expect(ws.readyState).toBe(ws.OPEN);
      ws.send(anyMessageText);
    });

    ws.addEventListener("message", (msg) => {
      expect(msg.data).toEqual(new Blob([anyMessageText]));
      ws.close(1000, "some reason");
      expect(ws.readyState).toBe(ws.CLOSING);
    });

    ws.addEventListener("close", (event) => {
      expect(ws.readyState).toBe(ws.CLOSED);
      expect(ws.url).toBe(URL);
      expect(event.reason).toBe("some reason");
      expect(event.code).toBe(1000);
      done();
    });
  }, 100);
});

testDone("connect, send, receive, close", (done, fail) => {
  const anyMessageText = "hello";
  const anyProtocol = "foobar";

  wss.once("connection", (ws) => {
    void ws.once("message", (msg) => {
      ws.send(msg);
    });
  });

  wss.on("error", (e) => {
    fail(e);
  });

  expect.assertions(9);

  const ws = new ReconnectingWebSocket(URL, anyProtocol, {
    minReconnectionDelay: 100,
    maxReconnectionDelay: 200
  });
  expect(ws.readyState).toBe(ws.CONNECTING);

  ws.addEventListener("open", () => {
    expect(ws.protocol).toBe(anyProtocol);
    expect(ws.readyState).toBe(ws.OPEN);
    ws.send(anyMessageText);
  });

  ws.addEventListener("message", (msg) => {
    expect(msg.data).toEqual(new Blob([anyMessageText]));
    ws.close(1000, "some reason");
    expect(ws.readyState).toBe(ws.CLOSING);
  });

  ws.addEventListener("close", (event) => {
    expect(ws.readyState).toBe(ws.CLOSED);
    expect(ws.url).toBe(URL);
    expect(event.reason).toBe("some reason");
    expect(event.code).toBe(1000);
    done();
  });
});

testDone("connect, send, receive, reconnect", (done) => {
  const anyMessageText = "hello";
  const anyProtocol = "foobar";

  function onConnection(ws: NodeWebSocket) {
    ws.once("message", (msg) => {
      ws.send(msg);
    });
  }

  wss.on("connection", onConnection);

  const totalRounds = 3;
  let currentRound = 0;

  // 6 = 3 * 2 open
  // 8 = 2 * 3 message + 2 reconnect
  // 7 = 2 * 3 close + 1 closed
  expect.assertions(21);

  const ws = new ReconnectingWebSocket(URL, anyProtocol, {
    minReconnectionDelay: 100,
    maxReconnectionDelay: 200
  });

  ws.onopen = () => {
    currentRound++;
    expect(ws.protocol).toBe(anyProtocol);
    expect(ws.readyState).toBe(ws.OPEN);
    ws.send(anyMessageText);
  };

  ws.onmessage = (msg) => {
    expect(msg.data).toEqual(new Blob([anyMessageText]));
    if (currentRound < totalRounds) {
      ws.reconnect(1000, "reconnect");
      expect(ws.retryCount).toBe(0);
    } else {
      ws.close(1000, "close");
    }
    expect(ws.readyState).toBe(ws.CLOSING);
  };

  ws.addEventListener("close", (event) => {
    expect(ws.url).toBe(URL);
    if (currentRound >= totalRounds) {
      expect(ws.readyState).toBe(ws.CLOSED);
      expect(event.reason).toBe("close");
      done();
      wss.off("connection", onConnection);
    } else {
      expect(event.reason).toBe("reconnect");
    }
  });
});

testDone("immediately-failed connection should not timeout", (done, fail) => {
  const ws = new ReconnectingWebSocket(ERROR_URL, undefined, {
    maxRetries: 2,
    connectionTimeout: 500,
    maxReconnectionDelay: 600
  });

  ws.addEventListener("error", (err: ErrorEvent) => {
    if (err.message === "TIMEOUT") {
      fail(new Error("timeout should not be called"));
    }
    if (ws.retryCount === 2) {
      done();
    }
    if (ws.retryCount > 2) {
      fail(new Error("too many retries"));
    }
  });
});

testDone(
  "immediately-failed connection with 0 maxRetries must not retry",
  (done, fail) => {
    const ws = new ReconnectingWebSocket(ERROR_URL, [], {
      maxRetries: 0,
      connectionTimeout: 1000,
      minReconnectionDelay: 100,
      maxReconnectionDelay: 200
    });

    let i = 0;
    ws.addEventListener("error", (err) => {
      i++;
      if (err.message === "TIMEOUT") {
        fail(new Error("timeout should not be called"));
      }
      if (i > 1) {
        fail(new Error("too many retries"));
      }
      setTimeout(() => {
        done();
      }, 1100);
    });
  }
);

testDone("connect and close before establishing connection", (done, fail) => {
  const ws = new ReconnectingWebSocket(URL, undefined, {
    minReconnectionDelay: 100,
    maxReconnectionDelay: 200
  });

  ws.close(); // closing before establishing connection

  ws.addEventListener("open", () => {
    fail(new Error("open should not be called"));
  });

  let closeCount = 0;
  ws.addEventListener("close", () => {
    closeCount++;
    if (closeCount > 1) {
      fail(new Error("close should be called once"));
    }
  });

  setTimeout(() => {
    // wait a little to be sure no unexpected open or close events happen
    done();
  }, 100);
});

testDone("enqueue messages", (done) => {
  const ws = new ReconnectingWebSocket(ERROR_URL, undefined, {
    maxRetries: 0
  });
  const count = 10;
  const message = "message";
  for (let i = 0; i < count; i++) ws.send(message);

  ws.onerror = () => {
    expect(ws.bufferedAmount).toBe(message.length * count);
    done();
  };
});

testDone("respect maximum enqueued messages", (done) => {
  const queueSize = 2;
  const ws = new ReconnectingWebSocket(ERROR_URL, undefined, {
    maxRetries: 0,
    maxEnqueuedMessages: queueSize
  });
  const count = 10;
  const message = "message";
  for (let i = 0; i < count; i++) ws.send(message);

  ws.onerror = () => {
    expect(ws.bufferedAmount).toBe(message.length * queueSize);
    done();
  };
});

testDone(
  "enqueue messages before websocket initialization with expected order",
  (done) => {
    const ws = new ReconnectingWebSocket(URL);

    const messages = ["message1", "message2", "message3"];

    messages.forEach((m) => ws.send(m));
    // @ts-ignore - accessing private field
    expect(ws._messageQueue.length).toBe(messages.length);

    expect(ws.bufferedAmount).toBe(messages.reduce((a, m) => a + m.length, 0));

    let i = 0;
    wss.once("connection", (client) => {
      client.on("message", (data) => {
        // eslint-disable-next-line @typescript-eslint/no-base-to-string
        if (data.toString() === "ok") {
          expect(i).toBe(messages.length);
          ws.close();
        } else {
          // eslint-disable-next-line @typescript-eslint/no-base-to-string
          expect(data.toString()).toBe(messages[i]);
          i++;
        }
      });
    });

    ws.addEventListener("open", () => {
      ws.send("ok");
    });

    ws.addEventListener("close", () => {
      done();
    });
  }
);

testDone("closing from the other side should reconnect", (done, fail) => {
  const ws = new ReconnectingWebSocket(URL, undefined, {
    minReconnectionDelay: 100,
    maxReconnectionDelay: 200
  });

  const max = 3;
  let i = 0;
  function onConnection(client: NodeWebSocket) {
    i++;
    if (i < max) {
      // closing client from server side should trigger a reconnection
      setTimeout(() => client.close(), 100);
    }
    if (i === max) {
      // will close from client side
    }
    if (i > max) {
      fail(new Error("unexpected connection"));
    }
  }
  wss.on("connection", onConnection);

  let j = 0;
  ws.addEventListener("open", () => {
    j++;
    if (j === max) {
      ws.close();
      // wait a little to ensure no new connections are opened
      setTimeout(() => {
        wss.off("connection", onConnection);
        done();
      }, 100);
    }
    if (j > max) {
      fail(new Error("unexpected open"));
    }
  });
});

testDone(
  "closing from the other side should allow to keep closed",
  (done, fail) => {
    const ws = new ReconnectingWebSocket(URL, undefined, {
      minReconnectionDelay: 100,
      maxReconnectionDelay: 200
    });

    const codes = [4000, 4001];

    let i = 0;
    function onConnection(client: NodeWebSocket) {
      if (i > codes.length) {
        fail(new Error("unexpected connection"));
      }
      client.close(codes[i], String(codes[i]));
      i++;
    }
    wss.on("connection", onConnection);

    ws.addEventListener("close", (e) => {
      if (e.code === codes[0]) {
        // do nothing, will reconnect
      }
      if (e.code === codes[1] && e.reason === String(codes[1])) {
        // close connection (and keep closed)
        ws.close();
        setTimeout(() => {
          wss.off("connection", onConnection);
          done();
        }, 200);
      }
    });
  }
);

testDone("reconnection delay grow factor", (done) => {
  const ws = new ReconnectingWebSocket(ERROR_URL, [], {
    minReconnectionDelay: 50,
    maxReconnectionDelay: 500,
    reconnectionDelayGrowFactor: 2
  });
  // @ts-ignore - accessing private field
  expect(ws._getNextDelay()).toBe(0);
  const expected = [50, 100, 200, 400, 500, 500];
  let retry = 0;
  ws.addEventListener("error", () => {
    // @ts-ignore - accessing private field
    expect(ws._getNextDelay()).toBe(expected[retry]);
    retry++;
    if (retry >= expected.length) {
      ws.close();
      setTimeout(() => {
        done();
      }, 100);
    }
  });
});

testDone("minUptime", (done) => {
  const ws = new ReconnectingWebSocket(URL, [], {
    minReconnectionDelay: 50,
    maxReconnectionDelay: 1000,
    reconnectionDelayGrowFactor: 2,
    minUptime: 250
  });
  const expectedDelays = [50, 100, 100, 200, 50, 50];
  const expectedRetryCount = [1, 2, 3, 4, 1, 1];
  let connectionCount = 0;

  function onConnection(client: NodeWebSocket) {
    connectionCount++;
    if (connectionCount <= expectedDelays.length) {
      setTimeout(() => {
        client.close();
      }, connectionCount * 20);
    }
  }

  wss.on("connection", onConnection);
  let openCount = 0;
  ws.addEventListener("open", () => {
    openCount++;
    if (openCount > expectedDelays.length) {
      ws.close();
      wss.off("connection", onConnection);
      done();
    }
  });
  let closeCount = 0;
  ws.addEventListener("close", () => {
    if (closeCount < expectedDelays.length) {
      // @ts-ignore - accessing private field
      expect(ws._getNextDelay()).toBe(expectedDelays[closeCount]);
      // @ts-ignore - accessing private field
      expect(ws._retryCount).toBe(expectedRetryCount[closeCount]);
      closeCount++;
    }
  });
});

testDone("reconnect after closing", (done, fail) => {
  const ws = new ReconnectingWebSocket(URL, undefined, {
    minReconnectionDelay: 100,
    maxReconnectionDelay: 200
  });

  let i = 0;
  ws.addEventListener("open", () => {
    i++;
    if (i === 1) {
      ws.close();
    }
    if (i === 2) {
      ws.close();
    }
    if (i > 2) {
      fail(new Error("no more expected reconnections"));
    }
  });

  ws.addEventListener("close", () => {
    if (i === 1)
      setTimeout(() => {
        ws.reconnect();
      }, 200);
    if (i === 2) {
      done();
    }
    if (i > 2) {
      fail(new Error("no more expected reconnections"));
    }
  });
});
