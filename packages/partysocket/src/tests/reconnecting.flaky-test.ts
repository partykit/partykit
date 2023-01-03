/**
 * @vitest-environment jsdom
 */

/* eslint-disable @typescript-eslint/ban-ts-comment, @typescript-eslint/no-explicit-any */
import { beforeEach, afterEach, test, expect, vitest } from "vitest";
import WebSocket from "ws";
import type { ErrorEvent } from "../reconnecting-websocket";
import ReconnectingWebSocket from "../reconnecting-websocket";
import { spawn } from "child_process";
const WebSocketServer = WebSocket.Server;

const PORT = 50123;
const PORT_UNRESPONSIVE = "50124";
const URL = `ws://localhost:${PORT}`;

beforeEach(() => {
  (global as any).WebSocket = WebSocket;
});

afterEach(() => {
  delete (global as any).WebSocket;
  vitest.restoreAllMocks();
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

test("throws with missing constructor", () => {
  delete (global as any).WebSocket;
  expect(() => {
    new ReconnectingWebSocket(URL, undefined, { maxRetries: 0 });
  }).toThrow();
});

test("throws with non-constructor object", () => {
  (global as any).WebSocket = {};
  expect(() => {
    new ReconnectingWebSocket(URL, undefined, { maxRetries: 0 });
  }).toThrow();
});

test("throws if not created with `new`", () => {
  expect(() => {
    // @ts-ignore
    ReconnectingWebSocket(URL, undefined);
  }).toThrow(TypeError);
});

function toPromise(fn: (resolve: () => void) => void) {
  return () =>
    new Promise<void>((resolve) => {
      fn(resolve);
    });
}

function testDone(name: string, fn: (resolve: () => void) => void) {
  test(name, toPromise(fn));
}

testDone("global WebSocket is used if available", (done) => {
  // @ts-ignore
  const ws = new ReconnectingWebSocket(URL, undefined, { maxRetries: 0 });
  ws.onerror = () => {
    // @ts-ignore
    expect(ws._ws instanceof WebSocket).toBe(true);
    done();
  };
});

testDone("getters when not ready", (done) => {
  const ws = new ReconnectingWebSocket(URL, undefined, {
    maxRetries: 0,
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

  const ws = new ReconnectingWebSocket(URL, undefined, {
    maxRetries: 0,
    debug: true,
  });

  ws.onerror = () => {
    expect(logSpy).toHaveBeenCalledWith("RWS>", "connect", 0);
    done();
  };
});

testDone("debug off", (done) => {
  const logSpy = vitest.spyOn(console, "log").mockReturnValue();

  const ws = new ReconnectingWebSocket(URL, undefined, { maxRetries: 0 });

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
  const wss = new WebSocketServer({ port: PORT });
  const ws = new ReconnectingWebSocket(URL, anyProtocol);

  ws.addEventListener("open", () => {
    expect(ws.url).toBe(URL);
    expect(ws.protocol).toBe(anyProtocol);
    ws.close();
  });

  ws.addEventListener("close", () => {
    wss.close(() => {
      setTimeout(done, 500);
    });
  });
});

testDone("undefined websocket protocol", (done) => {
  const wss = new WebSocketServer({ port: PORT });
  const ws = new ReconnectingWebSocket(URL, undefined, {});

  ws.addEventListener("open", () => {
    expect(ws.url).toBe(URL);
    expect(ws.protocol).toBe("");
    ws.close();
  });

  ws.addEventListener("close", () => {
    wss.close(() => {
      setTimeout(done, 500);
    });
  });
});

testDone("null websocket protocol", (done) => {
  const wss = new WebSocketServer({ port: PORT });

  // @ts-ignore - null is not allowed but could be passed in vanilla js
  const ws = new ReconnectingWebSocket(URL, null, {});
  ws.addEventListener("open", () => {
    expect(ws.url).toBe(URL);
    expect(ws.protocol).toBe("");
    ws.close();
  });

  ws.addEventListener("close", () => {
    wss.close(() => {
      setTimeout(done, 100);
    });
  });
});

test("websocket invalid protocolsProvider", () => {
  const ws = new ReconnectingWebSocket("ws://example.com", "foo", {});

  // @ts-ignore - accessing private property
  expect(() => ws._getNextProtocols(() => /Hahaha/)).toThrow();
});

testDone("websocket sync protocolsProvider", (done) => {
  const anyProtocol = "bar";
  const wss = new WebSocketServer({ port: PORT });

  const ws = new ReconnectingWebSocket(URL, () => anyProtocol, {});
  ws.addEventListener("open", () => {
    expect(ws.url).toBe(URL);
    expect(ws.protocol).toBe(anyProtocol);
    ws.close();
  });

  ws.addEventListener("close", () => {
    wss.close(() => setTimeout(done, 100));
  });
});

testDone("websocket async protocolsProvider", (done) => {
  const anyProtocol = "foo";
  const wss = new WebSocketServer({ port: PORT });

  const ws = new ReconnectingWebSocket(URL, async () => anyProtocol, {});
  ws.addEventListener("open", () => {
    expect(ws.url).toBe(URL);
    expect(ws.protocol).toBe(anyProtocol);
    ws.close();
  });

  ws.addEventListener("close", () => {
    wss.close(() => setTimeout(done, 100));
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
  const ws = new ReconnectingWebSocket(URL, undefined, {
    maxRetries: count,
    maxReconnectionDelay: 200,
  });

  ws.addEventListener("error", () => {
    if (ws.retryCount === count) {
      setTimeout(done, 500);
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
  const ws = new ReconnectingWebSocket(URL, undefined, {
    maxRetries: 4,
    reconnectionDelayGrowFactor: 1.2,
    maxReconnectionDelay: 20,
    minReconnectionDelay: 10,
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
  const wss = new WebSocketServer({ port: PORT });
  const ws = new ReconnectingWebSocket(URL, anyProtocol, {});

  ws.addEventListener("open", () => {
    expect(ws.protocol).toBe(anyProtocol);
    expect(ws.extensions).toBe("");
    expect(ws.bufferedAmount).toBe(0);
    ws.close();
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

  ws.addEventListener("close", () => {
    wss.close(() => {
      setTimeout(() => done(), 500);
    });
  });
});

// https://developer.mozilla.org/en-US/docs/Web/API/EventListener/handleEvent
testDone("level2 event listeners using object with handleEvent", (done) => {
  const anyProtocol = "foobar";
  const wss = new WebSocketServer({ port: PORT });
  const ws = new ReconnectingWebSocket(URL, anyProtocol, {});

  ws.addEventListener("open", {
    // @ts-ignore
    handleEvent: () => {
      expect(ws.protocol).toBe(anyProtocol);
      expect(ws.extensions).toBe("");
      expect(ws.bufferedAmount).toBe(0);
      ws.close();
    },
  });

  const fail = {
    handleEvent: () => {
      throw Error("fail");
    },
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

  // @ts-ignore
  ws.addEventListener("close", {
    // @ts-ignore
    handleEvent: () => {
      wss.close();
      setTimeout(() => done(), 500);
    },
  });
});

testDone("connection timeout", (done) => {
  const proc = spawn("node", [
    `${__dirname}/unresponsive-server.js`,
    PORT_UNRESPONSIVE,
    "5000",
  ]);

  let lock = false;
  proc.stdout.on("data", () => {
    if (lock) return;
    lock = true;

    const ws = new ReconnectingWebSocket(
      `ws://localhost:${PORT_UNRESPONSIVE}`,
      undefined,
      {
        minReconnectionDelay: 50,
        connectionTimeout: 500,
        maxRetries: 1,
      }
    );

    ws.addEventListener("error", (event) => {
      expect(event.message).toBe("TIMEOUT");
      if (ws.retryCount === 1) {
        setTimeout(() => done(), 1000);
      }
    });
  });
});

testDone("getters", (done) => {
  const anyProtocol = "foobar";
  const wss = new WebSocketServer({ port: PORT });
  const ws = new ReconnectingWebSocket(URL, anyProtocol, {
    maxReconnectionDelay: 100,
  });

  ws.addEventListener("open", () => {
    expect(ws.protocol).toBe(anyProtocol);
    expect(ws.extensions).toBe("");
    expect(ws.bufferedAmount).toBe(0);
    expect(ws.binaryType).toBe("nodebuffer");
    ws.close();
  });

  ws.addEventListener("close", () => {
    wss.close();
    setTimeout(() => done(), 500);
  });
});

testDone("binaryType", (done) => {
  const wss = new WebSocketServer({ port: PORT });
  const ws = new ReconnectingWebSocket(URL, undefined, {
    minReconnectionDelay: 0,
  });

  expect(ws.binaryType).toBe("blob");
  ws.binaryType = "arraybuffer";
  ws.addEventListener("open", () => {
    expect(ws.binaryType).toBe("arraybuffer");
    // @ts-ignore
    ws.binaryType = "nodebuffer";
    expect(ws.binaryType).toBe("nodebuffer");
    ws.close();
  });

  ws.addEventListener("close", () => {
    wss.close();
    setTimeout(() => done(), 500);
  });
});

testDone("calling to close multiple times", (done) => {
  const wss = new WebSocketServer({ port: PORT });
  const ws = new ReconnectingWebSocket(URL, undefined, {});

  ws.addEventListener("open", () => {
    ws.close();
    ws.close();
    ws.close();
  });

  ws.addEventListener("close", () => {
    wss.close();
    setTimeout(() => done(), 500);
  });
});

testDone("calling to reconnect when not ready", (done) => {
  const wss = new WebSocketServer({ port: PORT });
  const ws = new ReconnectingWebSocket(URL, undefined, {});
  ws.reconnect();
  ws.reconnect();

  ws.addEventListener("open", () => {
    ws.close();
  });

  ws.addEventListener("close", () => {
    wss.close();
    setTimeout(() => done(), 500);
  });
});

testDone("start closed", (done) => {
  const anyMessageText = "hello";
  const anyProtocol = "foobar";

  const wss = new WebSocketServer({ port: PORT });
  wss.on("connection", (ws: WebSocket) => {
    ws.on("message", (msg: WebSocket.Data) => {
      ws.send(msg);
    });
  });
  wss.on("error", () => {
    throw Error("error");
  });

  expect.assertions(8);

  const ws = new ReconnectingWebSocket(URL, anyProtocol, {
    minReconnectionDelay: 100,
    maxReconnectionDelay: 200,
    startClosed: true,
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
      expect(msg.data).toBe(anyMessageText);
      ws.close(1000, "");
      expect(ws.readyState).toBe(ws.CLOSING);
    });

    ws.addEventListener("close", () => {
      expect(ws.readyState).toBe(ws.CLOSED);
      expect(ws.url).toBe(URL);
      wss.close();
      setTimeout(() => done(), 1000);
    });
  }, 300);
});

testDone("connect, send, receive, close", (done) => {
  const anyMessageText = "hello";
  const anyProtocol = "foobar";

  const wss = new WebSocketServer({ port: PORT });
  wss.on("connection", (ws: WebSocket) => {
    ws.on("message", (msg: WebSocket.Data) => {
      ws.send(msg);
    });
  });
  wss.on("error", () => {
    throw Error("error");
  });

  expect.assertions(7);

  const ws = new ReconnectingWebSocket(URL, anyProtocol, {
    minReconnectionDelay: 100,
    maxReconnectionDelay: 200,
  });
  expect(ws.readyState).toBe(ws.CONNECTING);

  ws.addEventListener("open", () => {
    expect(ws.protocol).toBe(anyProtocol);
    expect(ws.readyState).toBe(ws.OPEN);
    ws.send(anyMessageText);
  });

  ws.addEventListener("message", (msg) => {
    expect(msg.data).toBe(anyMessageText);
    ws.close(1000, "");
    expect(ws.readyState).toBe(ws.CLOSING);
  });

  ws.addEventListener("close", () => {
    expect(ws.readyState).toBe(ws.CLOSED);
    expect(ws.url).toBe(URL);
    wss.close();
    setTimeout(() => done(), 1000);
  });
});

testDone("connect, send, receive, reconnect", (done) => {
  const anyMessageText = "hello";
  const anyProtocol = "foobar";

  const wss = new WebSocketServer({ port: PORT });
  wss.on("connection", (ws: WebSocket) => {
    ws.on("message", (msg: WebSocket.Data) => {
      ws.send(msg);
    });
  });

  const totalRounds = 3;
  let currentRound = 0;

  // 6 = 3 * 2 open
  // 8 = 2 * 3 message + 2 reconnect
  // 7 = 2 * 3 close + 1 closed
  expect.assertions(21);

  const ws = new ReconnectingWebSocket(URL, anyProtocol, {
    minReconnectionDelay: 100,
    maxReconnectionDelay: 200,
  });

  ws.onopen = () => {
    currentRound++;
    expect(ws.protocol).toBe(anyProtocol);
    expect(ws.readyState).toBe(ws.OPEN);
    ws.send(anyMessageText);
  };

  ws.onmessage = (msg) => {
    expect(msg.data).toBe(anyMessageText);
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
      wss.close();
      setTimeout(() => done(), 1000);
      expect(event.reason).toBe("close");
    } else {
      expect(event.reason).toBe("reconnect");
    }
  });
});

testDone("immediately-failed connection should not timeout", (done) => {
  const ws = new ReconnectingWebSocket("ws://255.255.255.255", undefined, {
    maxRetries: 2,
    connectionTimeout: 500,
  });

  ws.addEventListener("error", (err: ErrorEvent) => {
    if (err.message === "TIMEOUT") {
      throw Error("error");
    }
    if (ws.retryCount === 2) {
      setTimeout(() => done(), 500);
    }
    if (ws.retryCount > 2) {
      throw Error("error");
    }
  });
});

testDone(
  "immediately-failed connection with 0 maxRetries must not retry",
  (done) => {
    const ws = new ReconnectingWebSocket("ws://255.255.255.255", [], {
      maxRetries: 0,
      connectionTimeout: 2000,
      minReconnectionDelay: 100,
      maxReconnectionDelay: 200,
    });

    let i = 0;
    ws.addEventListener("error", (err) => {
      i++;
      if (err.message === "TIMEOUT") {
        throw Error("error");
      }
      if (i > 1) {
        throw Error("error");
      }
      setTimeout(() => {
        done();
      }, 2100);
    });
  }
);

testDone("connect and close before establishing connection", (done) => {
  const wss = new WebSocketServer({ port: PORT });
  const ws = new ReconnectingWebSocket(URL, undefined, {
    minReconnectionDelay: 100,
    maxReconnectionDelay: 200,
  });

  ws.close(); // closing before establishing connection

  ws.addEventListener("open", () => {
    throw Error("open called");
  });

  let closeCount = 0;
  ws.addEventListener("close", () => {
    closeCount++;
    if (closeCount > 1) {
      throw Error("close should be called once");
    }
  });

  setTimeout(() => {
    // wait a little to be sure no unexpected open or close events happen
    wss.close();
    done();
  }, 1000);
});

testDone("enqueue messages", (done) => {
  const ws = new ReconnectingWebSocket(URL, undefined, {
    maxRetries: 0,
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
  const ws = new ReconnectingWebSocket(URL, undefined, {
    maxRetries: 0,
    maxEnqueuedMessages: queueSize,
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
    const wss = new WebSocketServer({ port: PORT });
    const ws = new ReconnectingWebSocket(URL);

    const messages = ["message1", "message2", "message3"];

    messages.forEach((m) => ws.send(m));
    // @ts-ignore - accessing private field
    expect(ws._messageQueue.length).toBe(messages.length);

    expect(ws.bufferedAmount).toBe(messages.reduce((a, m) => a + m.length, 0));

    let i = 0;
    wss.on("connection", (client: WebSocket) => {
      client.on("message", (data: WebSocket.Data) => {
        if (data === "ok") {
          expect(i).toBe(messages.length);
          ws.close();
        } else {
          expect(data).toBe(messages[i]);
          i++;
        }
      });
    });

    ws.addEventListener("open", () => {
      ws.send("ok");
    });

    ws.addEventListener("close", () => {
      wss.close(() => {
        done();
      });
    });
  }
);

testDone("closing from the other side should reconnect", (done) => {
  const wss = new WebSocketServer({ port: PORT });
  const ws = new ReconnectingWebSocket(URL, undefined, {
    minReconnectionDelay: 100,
    maxReconnectionDelay: 200,
  });

  const max = 3;
  let i = 0;
  wss.on("connection", (client: WebSocket) => {
    i++;
    if (i < max) {
      // closing client from server side should trigger a reconnection
      setTimeout(() => client.close(), 100);
    }
    if (i === max) {
      // will close from client side
    }
    if (i > max) {
      throw Error("unexpected connection");
    }
  });

  let j = 0;
  ws.addEventListener("open", () => {
    j++;
    if (j === max) {
      ws.close();
      // wait a little to ensure no new connections are opened
      setTimeout(() => {
        wss.close(() => {
          done();
        });
      }, 500);
    }
    if (j > max) {
      throw Error("unexpected open");
    }
  });
});

testDone("closing from the other side should allow to keep closed", (done) => {
  const wss = new WebSocketServer({ port: PORT });
  const ws = new ReconnectingWebSocket(URL, undefined, {
    minReconnectionDelay: 100,
    maxReconnectionDelay: 200,
  });

  const codes = [4000, 4001];

  let i = 0;
  wss.on("connection", (client: WebSocket) => {
    if (i > codes.length) {
      throw Error("error");
    }
    client.close(codes[i], String(codes[i]));
    i++;
  });

  ws.addEventListener("close", (e) => {
    if (e.code === codes[0]) {
      // do nothing, will reconnect
    }
    if (e.code === codes[1] && e.reason === String(codes[1])) {
      // close connection (and keep closed)
      ws.close();
      setTimeout(() => {
        wss.close(() => done());
      }, 1000);
    }
  });
});

testDone("reconnection delay grow factor", (done) => {
  const ws = new ReconnectingWebSocket("wss://255.255.255.255", [], {
    minReconnectionDelay: 100,
    maxReconnectionDelay: 1000,
    reconnectionDelayGrowFactor: 2,
  });
  // @ts-ignore - accessing private field
  expect(ws._getNextDelay()).toBe(0);
  const expected = [100, 200, 400, 800, 1000, 1000];
  let retry = 0;
  ws.addEventListener("error", () => {
    // @ts-ignore - accessing private field
    expect(ws._getNextDelay()).toBe(expected[retry]);
    retry++;
    if (retry >= expected.length) {
      ws.close();
      setTimeout(() => {
        done();
      }, 2000);
    }
  });
});

testDone("minUptime", (done) => {
  const wss = new WebSocketServer({ port: PORT });
  const ws = new ReconnectingWebSocket(URL, [], {
    minReconnectionDelay: 100,
    maxReconnectionDelay: 2000,
    reconnectionDelayGrowFactor: 2,
    minUptime: 500,
  });
  const expectedDelays = [100, 200, 400, 800, 100, 100];
  const expectedRetryCount = [1, 2, 3, 4, 1, 1];
  let connectionCount = 0;
  wss.on("connection", (client: WebSocket) => {
    connectionCount++;
    if (connectionCount <= expectedDelays.length) {
      setTimeout(() => {
        client.close();
      }, connectionCount * 100);
    }
  });
  let openCount = 0;
  ws.addEventListener("open", () => {
    openCount++;
    if (openCount > expectedDelays.length) {
      ws.close();
      wss.close(() => {
        setTimeout(() => {
          done();
        }, 1000);
      });
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

testDone("reconnect after closing", (done) => {
  const wss = new WebSocketServer({ port: PORT });
  const ws = new ReconnectingWebSocket(URL, undefined, {
    minReconnectionDelay: 100,
    maxReconnectionDelay: 200,
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
      throw Error("no more expected reconnections");
    }
  });

  ws.addEventListener("close", () => {
    if (i === 1)
      setTimeout(() => {
        ws.reconnect();
      }, 1000);
    if (i === 2) {
      wss.close(() => {
        setTimeout(() => {
          done();
        }, 1000);
      });
    }
    if (i > 2) {
      throw Error("no more expected reconnections");
    }
  });
});
