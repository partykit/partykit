import { assertEquals, describe, it } from "vitest";

import { EventEmitter } from ".";

describe("EventEmitter", () => {
  describe(".on(event, fn)", () => {
    it("should add listeners", () => {
      const emitter = new EventEmitter();
      const calls: Array<string | number> = [];

      emitter.on("foo", (val: number) => {
        calls.push("one", val);
      });

      emitter.on("foo", (val: number) => {
        calls.push("two", val);
      });

      emitter.emit("foo", 1);
      emitter.emit("bar", 1);
      emitter.emit("foo", 2);

      assertEquals(calls, ["one", 1, "two", 1, "one", 2, "two", 2]);
    });

    it("should add listeners for events which are same names with methods of Object.prototype", () => {
      const emitter = new EventEmitter();
      const calls: Array<string | number> = [];

      emitter.on("constructor", (val: number) => {
        calls.push("one", val);
      });

      emitter.on("__proto__", (val: number) => {
        calls.push("two", val);
      });

      emitter.emit("constructor", 1);
      emitter.emit("__proto__", 2);

      assertEquals(calls, ["one", 1, "two", 2]);
    });
  });

  describe(".once(event, fn)", () => {
    it("should add a single-shot listener", () => {
      const emitter = new EventEmitter();
      const calls: Array<string | number> = [];

      emitter.once("foo", (val: number) => {
        calls.push("one", val);
      });

      emitter.emit("foo", 1);
      emitter.emit("foo", 2);
      emitter.emit("foo", 3);
      emitter.emit("bar", 1);

      assertEquals(calls, ["one", 1]);
    });
  });

  describe(".off(event, fn)", () => {
    it("should remove a listener", () => {
      const emitter = new EventEmitter();
      const calls: string[] = [];

      function one() {
        calls.push("one");
      }
      function two() {
        calls.push("two");
      }

      emitter.on("foo", one);
      emitter.on("foo", two);
      emitter.off("foo", two);

      emitter.emit("foo");

      assertEquals(calls, ["one"]);
    });

    it("should work with .once()", () => {
      const emitter = new EventEmitter();
      const calls: string[] = [];

      function one() {
        calls.push("one");
      }

      emitter.once("foo", one);
      emitter.once("fee", one);
      emitter.off("foo", one);

      emitter.emit("foo");

      assertEquals(calls, []);
    });

    it("should work when called from an event", () => {
      const emitter = new EventEmitter();
      let called;

      function b() {
        called = true;
      }
      emitter.on("tobi", () => {
        emitter.off("tobi", b);
      });
      emitter.on("tobi", b);
      emitter.emit("tobi");

      assertEquals(called, true);

      called = false;
      emitter.emit("tobi");

      assertEquals(called, false);
    });
  });

  describe(".off(event)", () => {
    it("should remove all listeners for an event", () => {
      const emitter = new EventEmitter();
      const calls: string[] = [];

      function one() {
        calls.push("one");
      }
      function two() {
        calls.push("two");
      }

      emitter.on("foo", one);
      emitter.on("foo", two);
      emitter.off("foo");

      emitter.emit("foo");
      emitter.emit("foo");

      assertEquals(calls, []);
    });

    it("should remove event array to avoid memory leak", () => {
      const emitter = new EventEmitter();

      function cb() {}

      emitter.on("foo", cb);
      emitter.off("foo", cb);

      // @ts-ignore check internal state
      assertEquals(emitter._listeners.has("foo"), false);
    });

    it("should only remove the event array when the last subscriber unsubscribes", () => {
      const emitter = new EventEmitter();

      function cb1() {}
      function cb2() {}

      emitter.on("foo", cb1);
      emitter.on("foo", cb2);
      emitter.off("foo", cb1);

      // @ts-ignore check internal state
      assertEquals(emitter._listeners.has("foo"), true);
    });
  });

  describe(".off()", () => {
    it("should remove all listeners", () => {
      const emitter = new EventEmitter();
      const calls: string[] = [];

      function one() {
        calls.push("one");
      }
      function two() {
        calls.push("two");
      }

      emitter.on("foo", one);
      emitter.on("bar", two);

      emitter.emit("foo");
      emitter.emit("bar");

      emitter.off();

      emitter.emit("foo");
      emitter.emit("bar");

      assertEquals(calls, ["one", "two"]);
    });
  });

  describe(".listeners(event)", () => {
    describe("when handlers are present", () => {
      it("should return an array of callbacks", () => {
        const emitter = new EventEmitter();

        function foo() {}
        emitter.on("foo", foo);

        assertEquals(emitter.listeners("foo"), [foo]);
      });
    });

    describe("when no handlers are present", () => {
      it("should return an empty array", () => {
        const emitter = new EventEmitter();

        assertEquals(emitter.listeners("foo"), []);
      });
    });
  });

  describe("typed events", () => {
    interface ListenEvents {
      foo: () => void;
    }

    interface EmitEvents {
      bar: (foo: number) => void;
    }

    interface ReservedEvents {
      foobar: (bar: string) => void;
    }

    class CustomEmitter extends EventEmitter<
      ListenEvents,
      EmitEvents,
      ReservedEvents
    > {
      foobar() {
        this.emitReserved("foobar", "1");
      }
    }

    const emitter = new CustomEmitter();
    emitter.on("foo", () => {});
    emitter.on("foobar", (_bar) => {});
    emitter.emit("bar", 1);
    emitter.foobar();
  });
});
