import {
  assertEquals,
  assertInstanceOf,
  assertStrictEquals,
  describe,
  it
} from "vitest";

import { Parser } from ".";

import type { Packet } from ".";

describe("engine.io-parser", () => {
  describe("single packet", () => {
    it("should encode/decode a string", () => {
      return new Promise((done) => {
        const packet: Packet = { type: "message", data: "test" };
        Parser.encodePacket(packet, true, (encodedPacket) => {
          assertEquals(encodedPacket, "4test");
          assertEquals(Parser.decodePacket(encodedPacket), packet);
          done();
        });
      });
    });

    it("should fail to decode a malformed packet", () => {
      assertEquals(Parser.decodePacket(""), {
        type: "error",
        data: "parser error"
      });
      assertEquals(Parser.decodePacket("a123"), {
        type: "error",
        data: "parser error"
      });
    });

    it("should encode/decode an ArrayBuffer", () => {
      return new Promise((done) => {
        const packet: Packet = {
          type: "message",
          data: Uint8Array.from([1, 2, 3, 4]).buffer
        };
        Parser.encodePacket(packet, true, (encodedPacket) => {
          assertEquals(
            new Uint8Array(encodedPacket as ArrayBuffer),
            Uint8Array.from([1, 2, 3, 4])
          );

          const decodedPacket = Parser.decodePacket(
            encodedPacket,
            "arraybuffer"
          );

          assertEquals(decodedPacket.type, packet.type);
          assertInstanceOf(decodedPacket.data, ArrayBuffer);
          assertEquals(
            new Uint8Array(decodedPacket.data as ArrayBuffer),
            new Uint8Array(packet.data as ArrayBuffer)
          );
          done();
        });
      });
    });

    it("should encode/decode an ArrayBuffer as base64", () => {
      return new Promise((done) => {
        const packet: Packet = {
          type: "message",
          data: Uint8Array.from([1, 2, 3, 4]).buffer
        };
        Parser.encodePacket(packet, false, (encodedPacket) => {
          assertEquals(encodedPacket, "bAQIDBA==");

          const decodedPacket = Parser.decodePacket(
            encodedPacket,
            "arraybuffer"
          );

          assertEquals(decodedPacket.type, packet.type);
          assertInstanceOf(decodedPacket.data, ArrayBuffer);
          assertEquals(
            new Uint8Array(decodedPacket.data as ArrayBuffer),
            new Uint8Array(packet.data as ArrayBuffer)
          );
          done();
        });
      });
    });

    it("should encode a typed array", () => {
      return new Promise((done) => {
        const buffer = Uint8Array.from([1, 2, 3, 4]).buffer;
        const data = new Uint8Array(buffer, 1, 2);

        Parser.encodePacket(
          { type: "message", data },
          true,
          (encodedPacket) => {
            assertStrictEquals(encodedPacket, data); // unmodified typed array
            done();
          }
        );
      });
    });

    it("should encode/decode a Blob", () => {
      return new Promise((done) => {
        const packet: Packet = {
          type: "message",
          data: new Blob(["1234", Uint8Array.from([1, 2, 3, 4])])
        };
        Parser.encodePacket(packet, true, (encodedPacket) => {
          assertInstanceOf(encodedPacket, Blob);

          const decodedPacket = Parser.decodePacket(encodedPacket, "blob");

          assertEquals(decodedPacket.type, "message");
          assertInstanceOf(decodedPacket.data, Blob);
          done();
        });
      });
    });

    it("should encode/decode a Blob as base64", () => {
      return new Promise((done) => {
        const packet: Packet = {
          type: "message",
          data: new Blob(["1234", Uint8Array.from([1, 2, 3, 4])])
        };
        Parser.encodePacket(packet, false, (encodedPacket) => {
          assertEquals(encodedPacket, "bMTIzNAECAwQ=");

          const decodedPacket = Parser.decodePacket(encodedPacket, "blob");

          assertEquals(decodedPacket.type, "message");
          assertInstanceOf(decodedPacket.data, Blob);
          done();
        });
      });
    });
  });

  describe("payload", () => {
    it("should encode/decode all packet types", () => {
      return new Promise((done) => {
        const packets: Packet[] = [
          { type: "open" },
          { type: "close" },
          { type: "ping", data: "probe" },
          { type: "pong", data: "probe" },
          { type: "message", data: "test" }
        ];

        Parser.encodePayload(packets, (payload) => {
          assertEquals(payload, "0\x1e1\x1e2probe\x1e3probe\x1e4test");
          assertEquals(Parser.decodePayload(payload), packets);
          done();
        });
      });
    });

    it("should fail to decode a malformed payload", () => {
      assertEquals(Parser.decodePayload("{"), [
        { type: "error", data: "parser error" }
      ]);
      assertEquals(Parser.decodePayload("{}"), [
        { type: "error", data: "parser error" }
      ]);
      assertEquals(Parser.decodePayload('["a123", "a456"]'), [
        { type: "error", data: "parser error" }
      ]);
    });

    it("should encode/decode a string + ArrayBuffer payload", () => {
      return new Promise((done) => {
        const packets: Packet[] = [
          { type: "message", data: "test" },
          { type: "message", data: Uint8Array.from([1, 2, 3, 4]).buffer }
        ];
        Parser.encodePayload(packets, (payload) => {
          assertEquals(payload, "4test\x1ebAQIDBA==");
          assertEquals(Parser.decodePayload(payload, "arraybuffer"), packets);
          done();
        });
      });
    });
  });
});
