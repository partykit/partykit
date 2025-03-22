const TIMESTAMP32_MAX_SEC = 0x100000000 - 1; // 32-bit unsigned int
const TIMESTAMP64_MAX_SEC = 0x400000000 - 1; // 34-bit unsigned int

function utf8Write(view: DataView, offset: number, str: string) {
  let c = 0;
  for (let i = 0; i < str.length; i++) {
    c = str.charCodeAt(i);
    if (c < 0x80) {
      view.setUint8(offset++, c);
    } else if (c < 0x800) {
      view.setUint8(offset++, 0xc0 | (c >> 6));
      view.setUint8(offset++, 0x80 | (c & 0x3f));
    } else if (c < 0xd800 || c >= 0xe000) {
      view.setUint8(offset++, 0xe0 | (c >> 12));
      view.setUint8(offset++, 0x80 | ((c >> 6) & 0x3f));
      view.setUint8(offset++, 0x80 | (c & 0x3f));
    } else {
      i++;
      c = 0x10000 + (((c & 0x3ff) << 10) | (str.charCodeAt(i) & 0x3ff));
      view.setUint8(offset++, 0xf0 | (c >> 18));
      view.setUint8(offset++, 0x80 | ((c >> 12) & 0x3f));
      view.setUint8(offset++, 0x80 | ((c >> 6) & 0x3f));
      view.setUint8(offset++, 0x80 | (c & 0x3f));
    }
  }
}

function utf8Length(str: string) {
  let c = 0,
    length = 0;
  for (let i = 0; i < str.length; i++) {
    c = str.charCodeAt(i);
    if (c < 0x80) {
      length += 1;
    } else if (c < 0x800) {
      length += 2;
    } else if (c < 0xd800 || c >= 0xe000) {
      length += 3;
    } else {
      i++;
      length += 4;
    }
  }
  return length;
}

type DeferredElement = {
  _str?: string;
  _float?: number;
  _bin?: ArrayBuffer;
  _length: number;
  _offset: number;
};

function _encodeObject(
  bytes: number[],
  defers: DeferredElement[],
  value: Record<string, unknown>
): number {
  if (value.toJSON === "function") {
    return _encode(bytes, defers, (value.toJSON as unknown as () => unknown)());
  }

  const keys = [];
  let key: string;

  const allKeys = Object.keys(value);
  for (let i = 0, l = allKeys.length; i < l; i++) {
    key = allKeys[i];
    if (value[key] !== undefined && typeof value[key] !== "function") {
      keys.push(key);
    }
  }
  const length = keys.length;
  let size = 0;

  // fixmap
  if (length < 0x10) {
    bytes.push(length | 0x80);
    size = 1;
  } // map 16
  else if (length < 0x10000) {
    bytes.push(0xde, length >> 8, length);
    size = 3;
  } // map 32
  else if (length < 0x100000000) {
    bytes.push(0xdf, length >> 24, length >> 16, length >> 8, length);
    size = 5;
  } else {
    throw new Error("Object too large");
  }

  for (let i = 0; i < length; i++) {
    key = keys[i];
    size += _encode(bytes, defers, key);
    size += _encode(bytes, defers, value[key]);
  }
  return size;
}

function _encode(
  bytes: number[],
  defers: DeferredElement[],
  value: unknown
): number {
  const type = typeof value;
  let i = 0,
    hi = 0,
    lo = 0,
    length = 0,
    size = 0;

  if (type === "string") {
    length = utf8Length(value as string);

    // fixstr
    if (length < 0x20) {
      bytes.push(length | 0xa0);
      size = 1;
    } // str 8
    else if (length < 0x100) {
      bytes.push(0xd9, length);
      size = 2;
    } // str 16
    else if (length < 0x10000) {
      bytes.push(0xda, length >> 8, length);
      size = 3;
    } // str 32
    else if (length < 0x100000000) {
      bytes.push(0xdb, length >> 24, length >> 16, length >> 8, length);
      size = 5;
    } else {
      throw new Error("String too long");
    }
    defers.push({
      _str: value as string,
      _length: length,
      _offset: bytes.length
    });
    return size + length;
  }
  if (type === "number") {
    // TODO: encode to float 32?

    // float 64
    if (Math.floor(value as number) !== value || !isFinite(value)) {
      bytes.push(0xcb);
      defers.push({
        _float: value as number,
        _length: 8,
        _offset: bytes.length
      });
      return 9;
    }

    if (value >= 0) {
      // positive fixnum
      if (value < 0x80) {
        bytes.push(value);
        return 1;
      }
      // uint 8
      if (value < 0x100) {
        bytes.push(0xcc, value);
        return 2;
      }
      // uint 16
      if (value < 0x10000) {
        bytes.push(0xcd, value >> 8, value);
        return 3;
      }
      // uint 32
      if (value < 0x100000000) {
        bytes.push(0xce, value >> 24, value >> 16, value >> 8, value);
        return 5;
      }
      // uint 64
      hi = (value / Math.pow(2, 32)) >> 0;
      lo = value >>> 0;
      bytes.push(
        0xcf,
        hi >> 24,
        hi >> 16,
        hi >> 8,
        hi,
        lo >> 24,
        lo >> 16,
        lo >> 8,
        lo
      );
      return 9;
    } else {
      // negative fixnum
      if (value >= -0x20) {
        bytes.push(value);
        return 1;
      }
      // int 8
      if (value >= -0x80) {
        bytes.push(0xd0, value);
        return 2;
      }
      // int 16
      if (value >= -0x8000) {
        bytes.push(0xd1, value >> 8, value);
        return 3;
      }
      // int 32
      if (value >= -0x80000000) {
        bytes.push(0xd2, value >> 24, value >> 16, value >> 8, value);
        return 5;
      }
      // int 64
      hi = Math.floor(value / Math.pow(2, 32));
      lo = value >>> 0;
      bytes.push(
        0xd3,
        hi >> 24,
        hi >> 16,
        hi >> 8,
        hi,
        lo >> 24,
        lo >> 16,
        lo >> 8,
        lo
      );
      return 9;
    }
  }
  if (type === "object") {
    // nil
    if (value === null) {
      bytes.push(0xc0);
      return 1;
    }

    if (Array.isArray(value)) {
      length = value.length;

      // fixarray
      if (length < 0x10) {
        bytes.push(length | 0x90);
        size = 1;
      } // array 16
      else if (length < 0x10000) {
        bytes.push(0xdc, length >> 8, length);
        size = 3;
      } // array 32
      else if (length < 0x100000000) {
        bytes.push(0xdd, length >> 24, length >> 16, length >> 8, length);
        size = 5;
      } else {
        throw new Error("Array too large");
      }
      for (i = 0; i < length; i++) {
        size += _encode(bytes, defers, value[i]);
      }
      return size;
    }

    if (value instanceof Date) {
      const ms = value.getTime();
      const s = Math.floor(ms / 1e3);
      const ns = (ms - s * 1e3) * 1e6;

      if (s >= 0 && ns >= 0 && s <= TIMESTAMP64_MAX_SEC) {
        if (ns === 0 && s <= TIMESTAMP32_MAX_SEC) {
          // timestamp 32
          bytes.push(0xd6, 0xff, s >> 24, s >> 16, s >> 8, s);
          return 6;
        } else {
          // timestamp 64
          hi = s / 0x100000000;
          lo = s & 0xffffffff;
          bytes.push(
            0xd7,
            0xff,
            ns >> 22,
            ns >> 14,
            ns >> 6,
            hi,
            lo >> 24,
            lo >> 16,
            lo >> 8,
            lo
          );
          return 10;
        }
      } else {
        // timestamp 96
        hi = Math.floor(s / 0x100000000);
        lo = s >>> 0;
        bytes.push(
          0xc7,
          0x0c,
          0xff,
          ns >> 24,
          ns >> 16,
          ns >> 8,
          ns,
          hi >> 24,
          hi >> 16,
          hi >> 8,
          hi,
          lo >> 24,
          lo >> 16,
          lo >> 8,
          lo
        );
        return 15;
      }
    }

    if (value instanceof ArrayBuffer || ArrayBuffer.isView(value)) {
      length = value.byteLength;

      // bin 8
      if (length < 0x100) {
        bytes.push(0xc4, length);
        size = 2;
      } // bin 16
      else if (length < 0x10000) {
        bytes.push(0xc5, length >> 8, length);
        size = 3;
      } // bin 32
      else if (length < 0x100000000) {
        bytes.push(0xc6, length >> 24, length >> 16, length >> 8, length);
        size = 5;
      } else {
        throw new Error("Buffer too large");
      }
      defers.push({
        _bin:
          value instanceof ArrayBuffer ? value : (value.buffer as ArrayBuffer),
        _length: length,
        _offset: bytes.length
      });
      return size + length;
    }

    return _encodeObject(bytes, defers, value as Record<string, unknown>);
  }
  // false/true
  if (type === "boolean") {
    bytes.push(value ? 0xc3 : 0xc2);
    return 1;
  }
  if (type === "undefined") {
    bytes.push(0xc0);
    return 1;
  }
  // custom types like BigInt (typeof value === 'bigint')
  // @ts-ignore FIXME
  if (typeof value.toJSON === "function") {
    // @ts-ignore FIXME
    return _encode(bytes, defers, value.toJSON());
  }
  throw new Error("Could not encode");
}

export function encode(value: unknown) {
  const bytes: number[] = [];
  const defers: DeferredElement[] = [];
  const size = _encode(bytes, defers, value);
  const buf = new ArrayBuffer(size);
  const view = new DataView(buf);

  let deferIndex = 0;
  let deferWritten = 0;
  let nextOffset = -1;
  if (defers.length > 0) {
    nextOffset = defers[0]._offset;
  }

  let defer,
    deferLength = 0,
    offset = 0;
  for (let i = 0; i < bytes.length; i++) {
    view.setUint8(deferWritten + i, bytes[i]);
    if (i + 1 !== nextOffset) continue;
    defer = defers[deferIndex];
    deferLength = defer._length;
    offset = deferWritten + nextOffset;
    if (defer._bin) {
      const bin = new Uint8Array(defer._bin);
      for (let j = 0; j < deferLength; j++) {
        view.setUint8(offset + j, bin[j]);
      }
    } else if (defer._str) {
      utf8Write(view, offset, defer._str);
    } else if (defer._float !== undefined) {
      view.setFloat64(offset, defer._float);
    }
    deferIndex++;
    deferWritten += deferLength;
    if (defers[deferIndex]) {
      nextOffset = defers[deferIndex]._offset;
    }
  }
  return buf;
}
