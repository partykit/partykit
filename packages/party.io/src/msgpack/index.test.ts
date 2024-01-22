import { describe, it } from "vitest";

import { decode, encode } from ".";

function assertEquals(actual: unknown, expected: unknown) {
  if (actual !== expected) {
    throw new Error(`Expected ${expected}, got ${actual}`);
  }
}

function array(length: number): number[] {
  const arr = new Array<number>(length);
  for (let i = 0; i < arr.length; i++) {
    arr[i] = 0;
  }
  return arr;
}

function map(length: number) {
  const result: Record<string, number> = {};
  for (let i = 0; i < length; i++) {
    result[i + ""] = 0;
  }
  return result;
}

function bufferFromString(str: string) {
  return new TextEncoder().encode(str).buffer;
}

function bufferFromHexString(hex: string) {
  return new Uint8Array(hex.match(/[\da-f]{2}/gi)!.map((h) => parseInt(h, 16)));
}

function hexStringFromBuffer(buffer: ArrayBuffer) {
  return new Uint8Array(buffer).reduce(
    (a, b) => a + b.toString(16).padStart(2, "0"),
    ""
  );
}

function checkDecode(value: unknown, hex: string) {
  const decodedValue = decode(bufferFromHexString(hex));
  assertEquals(decodedValue, value);
}

function checkEncode(value: unknown, hex: string) {
  const encodedValue = encode(value);
  assertEquals(hexStringFromBuffer(encodedValue), hex);
}

function check(value: unknown, hex: string) {
  checkEncode(value, hex);
  checkDecode(value, hex);

  assertEquals(decode(encode(value)), value);
}

describe("msgpack", () => {
  it("positive fixint", () => {
    check(0x00, "00");
    check(0x44, "44");
    check(0x7f, "7f");
  });

  it("negative fixint", () => {
    check(-0x01, "ff");
    check(-0x10, "f0");
    check(-0x20, "e0");
  });

  it("fixmap", () => {
    check({}, "80");
    check({ a: 1, b: 2, c: 3 }, "83a16101a16202a16303");
  });

  it("fixarray", () => {
    check([], "90");
    check([1, 2, 3, 4], "9401020304");
  });

  it("fixstr", () => {
    check("", "a0");
    check("hello", "a568656c6c6f");
  });

  it("nil", () => {
    check(null, "c0");
    checkEncode(undefined, "c0");
  });

  it("false", () => {
    check(false, "c2");
  });

  it("true", () => {
    check(true, "c3");
  });

  it("bin 8", function () {
    check(new ArrayBuffer(0), "c4" + "00");
    check(bufferFromString("\x00"), "c4" + "01" + "00");
    check(bufferFromString("hello"), "c4" + "05" + "68656c6c6f");

    checkEncode(Uint8Array.of(1, 2, 3, 4), "c4" + "04" + "01020304");
  });

  it("bin 16", function () {
    check(bufferFromString("a".repeat(256)), "c5" + "0100" + "61".repeat(256));
    const array = new Uint8Array(256);
    array.fill(8);
    checkEncode(array.buffer, "c5" + "0100" + "08".repeat(256));
  });

  it("bin 32", function () {
    check(
      bufferFromString("a".repeat(65536)),
      "c6" + "00010000" + "61".repeat(65536)
    );
    const array = new Uint8Array(65536);
    array.fill(9);
    checkEncode(array.buffer, "c6" + "00010000" + "09".repeat(65536));
  });

  it("ext 8", function () {
    checkDecode(
      [127, bufferFromString("hello")],
      "c7" + "05" + "7f" + "68656c6c6f"
    );
  });

  it("ext 16", function () {
    checkDecode(
      [1, bufferFromString("a".repeat(256))],
      "c8" + "0100" + "01" + "61".repeat(256)
    );
  });

  it("ext 32", function () {
    checkDecode(
      [-128, bufferFromString("a".repeat(65536))],
      "c9" + "00010000" + "80" + "61".repeat(65536)
    );
  });

  // float 32
  // JavaScript doesn't support single precision floating point numbers

  it("float 32", function () {
    const buffer = new ArrayBuffer(5);
    const view = new DataView(buffer);
    view.setUint8(0, 0xca);
    view.setFloat32(1, 0.5);
    checkDecode(0.5, hexStringFromBuffer(buffer));
  });

  it("float 64", function () {
    check(1.1, "cb" + "3ff199999999999a");
    check(1234567891234567.5, "cb" + "43118b54f26ebc1e");
    check(Infinity, "cb" + "7ff0000000000000");
    check(-Infinity, "cb" + "fff0000000000000");
    check(NaN, "cb" + "7ff8000000000000");
  });

  it("uint 8", function () {
    check(128, "cc80");
    check(255, "ccff");
  });

  it("uint 16", function () {
    check(256, "cd0100");
    check(65535, "cdffff");
  });

  it("uint 32", function () {
    check(65536, "ce00010000");
    check(4294967295, "ceffffffff");
  });

  it("uint 64", function () {
    check(4294967296, "cf0000000100000000");
    check(Math.pow(2, 53) - 1, "cf001fffffffffffff");
    // unsafe unsigned integer
    check(Math.pow(2, 63), "cf8000000000000000");
    check(Math.pow(2, 63) + 1024, "cf8000000000000000");
  });

  // NOTE: We'll always encode a positive number as a uint, but we should be
  // able to decode a positive int value

  it("int 8", function () {
    checkDecode(127, "d07f");
    checkDecode(32, "d020");
    checkDecode(1, "d001");
    checkDecode(0, "d000");
    checkDecode(-1, "d0ff");
    check(-33, "d0df");
    check(-128, "d080");
  });

  it("int 16", function () {
    checkDecode(32767, "d17fff");
    checkDecode(128, "d10080");
    checkDecode(1, "d10001");
    checkDecode(0, "d10000");
    checkDecode(-1, "d1ffff");
    check(-129, "d1ff7f");
    check(-32768, "d18000");
  });

  it("int 32", function () {
    checkDecode(2147483647, "d27fffffff");
    checkDecode(32768, "d200008000");
    checkDecode(1, "d200000001");
    checkDecode(0, "d200000000");
    checkDecode(-1, "d2ffffffff");
    check(-32769, "d2ffff7fff");
    check(-2147483648, "d280000000");
  });

  it("int 64", function () {
    checkDecode(Math.pow(2, 53), "d30020000000000000");
    checkDecode(4294967296, "d30000000100000000");
    checkDecode(1, "d30000000000000001");
    checkDecode(0, "d30000000000000000");
    checkDecode(-1, "d3ffffffffffffffff");
    check(-2147483649, "d3ffffffff7fffffff");
    check(-4294967297, "d3fffffffeffffffff");
    check(-65437650001231, "d3ffffc47c1c1de2b1");
    check(-1111111111111111, "d3fffc0d7348ea8e39");
    check(-1532678092380345, "d3fffa8e0992bfa747");
    check(-4503599627370496, "d3fff0000000000000");
    check(-7840340234323423, "d3ffe42540896a3a21");
    // Minimum safe signed integer
    check(-Math.pow(2, 53) + 1, "d3ffe0000000000001");
    // unsafe signed integer
    check(-Math.pow(2, 63), "d38000000000000000");
    check(-Math.pow(2, 63) - 1024, "d38000000000000000");
  });

  it("fixext 1", function () {
    checkDecode([127, bufferFromString("a")], "d4" + "7f" + "61");
  });

  it("fixext 2", function () {
    checkDecode([127, bufferFromString("ab")], "d5" + "7f" + "6162");
  });

  it("fixext 4", function () {
    checkDecode([127, bufferFromString("abcd")], "d6" + "7f" + "61626364");
  });

  it("fixext 8", function () {
    checkDecode(
      [127, bufferFromString("abcd".repeat(2))],
      "d7" + "7f" + "61626364".repeat(2)
    );
  });

  it("fixext 16", function () {
    checkDecode(
      [-128, bufferFromString("abcd".repeat(4))],
      "d8" + "80" + "61626364".repeat(4)
    );
  });

  it("timestamp ext", function () {
    check(new Date(0), "d6ff00000000");
    check(
      new Date("1956-06-17T00:00:00.000Z"),
      "c70cff00000000ffffffffe6876500"
    );
    check(new Date("1970-01-01T00:00:00.000Z"), "d6ff00000000");
    check(new Date("2000-06-13T00:00:00.000Z"), "d6ff39457980");
    check(new Date("2005-12-31T23:59:59.999Z"), "d7ffee2e1f0043b71b7f");
    check(new Date("2140-01-01T13:14:15.678Z"), "d7ffa1a5d6013fc2faa7");
  });

  it("str 8", function () {
    check("α", "a2ceb1");
    check("亜", "a3e4ba9c");
    check("\uD83D\uDC26", "a4f09f90a6");
    check("a".repeat(32), "d9" + "20" + "61".repeat(32));
    check("a".repeat(255), "d9" + "ff" + "61".repeat(255));
  });

  it("str 16", function () {
    check("a".repeat(256), "da" + "0100" + "61".repeat(256));
    check("a".repeat(65535), "da" + "ffff" + "61".repeat(65535));
  });

  it("str 32", function () {
    check("a".repeat(65536), "db" + "00010000" + "61".repeat(65536));
  });

  it("array 16", function () {
    check(array(16), "dc" + "0010" + "00".repeat(16));
    check(array(65535), "dc" + "ffff" + "00".repeat(65535));
  });

  it("array 32", function () {
    check(array(65536), "dd" + "00010000" + "00".repeat(65536));
  });

  it("map 16", function () {
    check(
      {
        0: 0,
        1: 1,
        2: 2,
        3: 3,
        4: 4,
        5: 5,
        6: 6,
        7: 7,
        8: 8,
        9: 9,
        a: 10,
        b: 11,
        c: 12,
        d: 13,
        e: 14,
        f: 15
      },
      "de" +
        "0010" +
        "a13000a13101a13202a13303a13404a13505a13606a13707a13808a13909a1610aa1620ba1630ca1640da1650ea1660f"
    );
    const map16 = map(65535);
    const encoded = encode(map16);
    assertEquals(hexStringFromBuffer(encoded).startsWith("deffff"), true);
    assertEquals(decode(encoded), map16);
  });

  it("map 32", function () {
    const map32 = map(65536);
    const encoded = encode(map32);
    assertEquals(hexStringFromBuffer(encoded).startsWith("df00010000"), true);
    assertEquals(decode(encoded), map32);
  });

  it("toJSON", function () {
    const obj = {
      a: "b",
      toJSON: function () {
        return "c";
      }
    };
    assertEquals(encode(obj), encode("c"));
  });

  it("toJSON for BigInt", function () {
    // @ts-expect-error custom encoding
    BigInt.prototype.toJSON = function () {
      return String(this);
    };
    try {
      checkEncode(BigInt(1234), "a431323334");
    } finally {
      // @ts-expect-error custom encoding
      delete BigInt.prototype.toJSON;
    }
  });

  it("undefined as array elem or map value", function () {
    const value = {
      a: undefined,
      b: null,
      c: [undefined, null]
    };
    const expected = {
      b: null,
      c: [null, null]
    };
    assertEquals(decode(encode(value)), expected);
  });
});
