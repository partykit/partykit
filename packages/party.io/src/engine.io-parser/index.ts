import { decodeFromBase64, encodeToBase64 } from "./base64-arraybuffer";

const SEPARATOR = String.fromCharCode(30); // see https://en.wikipedia.org/wiki/Delimiter#ASCII_delimited_text

export type PacketType =
  | "open"
  | "close"
  | "ping"
  | "pong"
  | "message"
  | "upgrade"
  | "noop"
  | "error";

export type RawData = string | ArrayBuffer | ArrayBufferView | Blob; //
// TODO: check this  | Blob;

export interface Packet {
  type: PacketType;
  data?: RawData;
}

const PACKET_TYPES = new Map<PacketType, string>();
const PACKET_TYPES_REVERSE = new Map<string, PacketType>();

(
  [
    "open",
    "close",
    "ping",
    "pong",
    "message",
    "upgrade",
    "noop"
  ] as PacketType[]
).forEach((type, index) => {
  PACKET_TYPES.set(type, "" + index);
  PACKET_TYPES_REVERSE.set("" + index, type);
});

const ERROR_PACKET: Packet = { type: "error", data: "parser error" };

type BinaryType = "arraybuffer" | "blob";

export const Parser = {
  encodePacket(
    { type, data }: Packet,
    supportsBinary: boolean,
    callback: (encodedPacket: RawData) => void
  ) {
    if (data instanceof Blob) {
      return supportsBinary
        ? callback(data)
        : encodeBlobAsBase64(data, callback);
    } else if (data instanceof ArrayBuffer) {
      return callback(supportsBinary ? data : "b" + encodeToBase64(data));
    } else if (ArrayBuffer.isView(data)) {
      if (supportsBinary) {
        return callback(data);
      } else {
        const array = new Uint8Array(
          data.buffer,
          data.byteOffset,
          data.byteLength
        );
        return callback("b" + encodeToBase64(array as unknown as ArrayBuffer));
      }
    }
    // plain string
    return callback(PACKET_TYPES.get(type) + (data || ""));
  },

  decodePacket(encodedPacket: RawData, binaryType?: BinaryType): Packet {
    if (typeof encodedPacket !== "string") {
      return {
        type: "message",
        data: mapBinary(encodedPacket, binaryType)
      };
    }
    const typeChar = encodedPacket.charAt(0);
    if (typeChar === "b") {
      const buffer = decodeFromBase64(encodedPacket.substring(1));
      return {
        type: "message",
        data: mapBinary(buffer, binaryType)
      };
    }
    if (!PACKET_TYPES_REVERSE.has(typeChar)) {
      return ERROR_PACKET;
    }
    const type = PACKET_TYPES_REVERSE.get(typeChar)!;
    return encodedPacket.length > 1
      ? {
          type,
          data: encodedPacket.substring(1)
        }
      : {
          type
        };
  },

  encodePayload(packets: Packet[], callback: (encodedPayload: string) => void) {
    // some packets may be added to the array while encoding, so the initial length must be saved
    const length = packets.length;
    const encodedPackets = new Array(length);
    let count = 0;

    packets.forEach((packet, i) => {
      // force base64 encoding for binary packets
      this.encodePacket(packet, false, (encodedPacket) => {
        encodedPackets[i] = encodedPacket;
        if (++count === length) {
          callback(encodedPackets.join(SEPARATOR));
        }
      });
    });
  },

  decodePayload(encodedPayload: string, binaryType?: BinaryType): Packet[] {
    const encodedPackets = encodedPayload.split(SEPARATOR);
    const packets = [];
    for (let i = 0; i < encodedPackets.length; i++) {
      const decodedPacket = this.decodePacket(encodedPackets[i], binaryType);
      packets.push(decodedPacket);
      if (decodedPacket.type === "error") {
        break;
      }
    }
    return packets;
  }
};

function encodeBlobAsBase64(
  data: Blob,
  callback: (encodedPacket: RawData) => void
) {
  // @ts-expect-error TODO
  const fileReader = new FileReader();
  fileReader.onload = function () {
    const content = (fileReader.result as string).split(",")[1];
    callback("b" + content);
  };
  return fileReader.readAsDataURL(data);
}

function mapBinary(data: RawData, binaryType?: BinaryType) {
  switch (binaryType) {
    case "blob":
      return new Blob([data]);
    case "arraybuffer":
    default:
      return data; // assuming the data is already an ArrayBuffer
  }
}
