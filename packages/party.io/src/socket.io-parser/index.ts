/* eslint-disable @typescript-eslint/no-explicit-any */
// TODO

import { type RawData } from "../engine.io-parser";
import { EventEmitter } from "../event-emitter";
import { getLogger } from "../logger";

export enum PacketType {
  CONNECT,
  DISCONNECT,
  EVENT,
  ACK,
  CONNECT_ERROR,
  BINARY_EVENT,
  BINARY_ACK
}

export interface Packet {
  type: PacketType;
  nsp: string;
  data?: any;
  id?: number;
  attachments?: number;
}

type Attachments = ArrayBuffer | ArrayBufferView | Blob;

export class Encoder {
  public encode(packet: Packet): RawData[] {
    if (packet.type === PacketType.EVENT || packet.type === PacketType.ACK) {
      const attachments: Attachments[] = [];
      extractAttachments(packet.data, attachments);
      if (attachments.length) {
        packet.attachments = attachments.length;
        packet.type =
          packet.type === PacketType.EVENT
            ? PacketType.BINARY_EVENT
            : PacketType.BINARY_ACK;
        return [encodeAsString(packet), ...attachments];
      }
    }
    return [encodeAsString(packet)];
  }
}

function encodeAsString(packet: Packet): string {
  let output = "" + packet.type;

  if (
    packet.type === PacketType.BINARY_EVENT ||
    packet.type === PacketType.BINARY_ACK
  ) {
    output += packet.attachments + "-";
  }

  if (packet.nsp !== "/") {
    output += packet.nsp + ",";
  }

  if (packet.id !== undefined) {
    output += packet.id;
  }

  if (packet.data) {
    output += JSON.stringify(packet.data);
  }

  getLogger("socket.io").debug(`[parser] encoded packet as ${output}`);

  return output;
}

/**
 * Extract the binary attachments from the payload
 * @param data
 * @param attachments
 */
function extractAttachments(data: any, attachments: Attachments[]) {
  if (Array.isArray(data)) {
    for (let i = 0; i < data.length; i++) {
      const elem = data[i];
      if (isAttachment(elem)) {
        data[i] = { _placeholder: true, num: attachments.length };
        attachments.push(elem);
      } else {
        extractAttachments(data[i], attachments);
      }
    }
  } else if (typeof data === "object" && !(data instanceof Date)) {
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        const elem = data[key];
        if (isAttachment(elem)) {
          data[key] = { _placeholder: true, num: attachments.length };

          attachments.push(elem);
        } else {
          extractAttachments(data[key], attachments);
        }
      }
    }
  }
}

function isAttachment(data: any): boolean {
  return (
    data instanceof ArrayBuffer ||
    ArrayBuffer.isView(data) ||
    data instanceof Blob
  );
}

interface DecoderEvents {
  packet: (packet: Packet) => void;
  error: () => void;
}

export class Decoder extends EventEmitter<
  Record<never, never>,
  Record<never, never>,
  DecoderEvents
> {
  private buffer?: {
    packet: Packet;
    attachments: Attachments[];
  };

  public add(data: RawData): void {
    if (typeof data === "string") {
      if (this.buffer) {
        getLogger("socket.io").debug(
          "[parser] got plaintext data while reconstructing a packet"
        );
        this.emitReserved("error");
        return;
      }

      const packet = decodeString(data);

      if (packet === null) {
        this.emitReserved("error");
      } else if (packet.attachments) {
        this.buffer = {
          packet,
          attachments: []
        };
      } else {
        this.emitReserved("packet", packet);
      }
    } else {
      if (!this.buffer) {
        getLogger("socket.io").debug(
          "[parser] got plaintext data while not reconstructing a packet"
        );
        this.emitReserved("error");
        return;
      }
      const { packet, attachments } = this.buffer;
      attachments.push(data);
      if (attachments.length === packet.attachments) {
        injectAttachments(packet.data, attachments);
        this.emitReserved("packet", packet);
        this.buffer = undefined;
      }
    }
  }

  public destroy() {
    this.buffer = undefined;
  }
}

function decodeString(str: string): Packet | null {
  const packet: Partial<Packet> = {};

  const type = parseInt(str.charAt(0), 10) as PacketType;
  if (PacketType[type] === undefined) {
    getLogger("socket.io").debug(`[parser] unknown packet type: ${type}`);
    return null;
  }
  packet.type = type;

  let i = 0;
  if (type === PacketType.BINARY_EVENT || type === PacketType.BINARY_ACK) {
    const start = i + 1;
    while (str.charAt(++i) !== "-" && i !== str.length) {
      // advance cursor
    }
    const attachments = parseInt(str.substring(start, i), 10);
    if (str.charAt(i) !== "-" || !isFinite(attachments) || attachments < 0) {
      getLogger("socket.io").debug(
        `[parser] illegal attachment count: ${attachments}`
      );
      return null;
    }
    packet.attachments = attachments;
  }

  if (str.charAt(i + 1) === "/") {
    const start = i + 1;
    while (str.charAt(++i) !== "," && i !== str.length) {
      // advance cursor
    }
    packet.nsp = str.substring(start, i);
  } else {
    packet.nsp = "/";
  }

  if (isValidCharCodeForInteger(str.charCodeAt(i + 1))) {
    const start = i + 1;
    while (++i !== str.length) {
      if (!isValidCharCodeForInteger(str.charCodeAt(i))) {
        --i;
        break;
      }
    }
    packet.id = parseInt(str.substring(start, i + 1), 10);
  }

  if (str.charAt(++i)) {
    let payload;
    try {
      // eslint-disable-next-line deprecation/deprecation
      payload = JSON.parse(str.substr(i));
    } catch (err) {
      getLogger("socket.io").debug(`[parser] invalid payload: ${err}`);
      return null;
    }
    if (!isPayloadValid(type, payload)) {
      getLogger("socket.io").debug(`[parser] invalid payload`);
      return null;
    }
    packet.data = payload;
  }

  return packet as Packet;
}

function isValidCharCodeForInteger(code: number) {
  return code >= 48 && code <= 57;
}

function isPayloadValid(type: PacketType, payload: unknown): boolean {
  switch (type) {
    case PacketType.CONNECT:
      return typeof payload === "object";
    case PacketType.DISCONNECT:
      return payload === undefined;
    case PacketType.CONNECT_ERROR:
      return typeof payload === "string" || typeof payload === "object";
    case PacketType.EVENT:
    case PacketType.BINARY_EVENT:
      return Array.isArray(payload) && payload.length > 0;
    case PacketType.ACK:
    case PacketType.BINARY_ACK:
      return Array.isArray(payload);
  }
}

function injectAttachments(data: any, attachments: Attachments[]) {
  if (Array.isArray(data)) {
    for (let i = 0; i < data.length; i++) {
      const elem = data[i];
      if (elem && elem._placeholder === true) {
        data[i] = attachments.shift();
      } else {
        injectAttachments(elem, attachments);
      }
    }
  } else if (typeof data === "object" && !(data instanceof Date)) {
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        const elem = data[key];
        if (elem && elem._placeholder === true) {
          data[key] = attachments.shift();
        } else {
          injectAttachments(elem, attachments);
        }
      }
    }
  }
}
