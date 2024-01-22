import { type RawData } from "@/engine.io-parser";
import { assertEquals, describe, it } from "vitest";

import { Decoder, Encoder, PacketType } from ".";

import type { Packet } from ".";

const encoder = new Encoder();

describe("socket.io-parser", () => {
  describe("without attachments", () => {
    it("should encode/decode a CONNECT packet (main namespace)", () => {
      const packet = {
        type: PacketType.CONNECT,
        nsp: "/"
      };
      return testEncodeDecode(packet, "0");
    });

    it("should encode/decode a CONNECT packet (custom namespace)", () => {
      const packet = {
        type: PacketType.CONNECT,
        nsp: "/woot",
        data: {
          token: "123"
        }
      };
      return testEncodeDecode(packet, '0/woot,{"token":"123"}');
    });

    it("should encode/decode a DISCONNECT packet", () => {
      const packet = {
        type: PacketType.DISCONNECT,
        nsp: "/"
      };
      return testEncodeDecode(packet, "1");
    });

    it("should encode/decode an EVENT packet", () => {
      const packet = {
        type: PacketType.EVENT,
        nsp: "/",
        data: ["a", 1, {}]
      };
      return testEncodeDecode(packet, '2["a",1,{}]');
    });

    it("should encode/decode an EVENT packet with an ACK id", () => {
      const packet = {
        type: PacketType.EVENT,
        nsp: "/",
        id: 1,
        data: ["a", 1, {}]
      };
      return testEncodeDecode(packet, '21["a",1,{}]');
    });

    it("should encode/decode an ACK packet", () => {
      const packet = {
        type: PacketType.ACK,
        nsp: "/",
        id: 123,
        data: ["a", 1, {}]
      };
      return testEncodeDecode(packet, '3123["a",1,{}]');
    });

    it("should encode/decode a CONNECT_ERROR packet", () => {
      const packet = {
        type: PacketType.CONNECT_ERROR,
        nsp: "/",
        data: {
          message: "Unauthorized"
        }
      };
      return testEncodeDecode(packet, '4{"message":"Unauthorized"}');
    });

    it("should emit a 'decode_error' event upon parsing error", async () => {
      await expectDecodeError('442["some","data"');
      await expectDecodeError('0/admin,"invalid"');
      await expectDecodeError("1/admin,{}");
      await expectDecodeError('2/admin,"invalid');
      await expectDecodeError("2/admin,{}");
      await expectDecodeError("999");
      await expectDecodeError("5");
    });
  });

  describe("with binary attachments", () => {
    it("should encode/decode an EVENT packet with multiple binary attachments", () => {
      return new Promise((done) => {
        const packet = {
          type: PacketType.EVENT,
          nsp: "/cool",
          id: 23,
          data: [
            "a",
            { b: Uint8Array.from([1, 2, 3]) },
            ["c", Int32Array.from([4, 5, 6])]
          ]
        };

        const encodedPackets = encoder.encode(packet);

        assertEquals(encodedPackets.length, 3);
        assertEquals(
          encodedPackets[0],
          '52-/cool,23["a",{"b":{"_placeholder":true,"num":0}},["c",{"_placeholder":true,"num":1}]]'
        );
        assertEquals(encodedPackets[1], Uint8Array.from([1, 2, 3]));
        assertEquals(encodedPackets[2], Int32Array.from([4, 5, 6]));

        const decoder = new Decoder();

        decoder.on("packet", (decodedPacket) => {
          assertEquals(decodedPacket, {
            type: PacketType.BINARY_EVENT,
            nsp: "/cool",
            id: 23,
            data: [
              "a",
              { b: Uint8Array.from([1, 2, 3]) },
              ["c", Int32Array.from([4, 5, 6])]
            ],
            attachments: 2
          });

          done();
        });

        encodedPackets.forEach((p) => decoder.add(p));
      });
    });

    it("should emit a 'decode_error' event when adding an attachment without header", () => {
      return expectDecodeError(Uint8Array.from([1, 2, 3]));
    });

    it("should emit a 'decode_error' event when decoding a binary event without attachments", () => {
      return expectDecodeError(
        '51-["hello",{"_placeholder":true,"num":0}]',
        '2["hello"]'
      );
    });
  });
});

function testEncodeDecode(packet: Packet, expected: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const encodedPackets = encoder.encode(packet);

    assertEquals(encodedPackets.length, 1);
    assertEquals(encodedPackets[0], expected);

    const decoder = new Decoder();

    decoder.on("packet", (decodedPacket) => {
      assertEquals(decodedPacket, packet);

      resolve();
    });

    decoder.on("error", () => {
      reject("should not happen");
    });

    decoder.add(encodedPackets[0]);
  });
}

function expectDecodeError(...encodedPackets: RawData[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const decoder = new Decoder();

    decoder.on("packet", () => {
      reject("should not happen");
    });

    decoder.on("error", () => {
      resolve();
    });

    encodedPackets.forEach((p) => decoder.add(p));
  });
}
