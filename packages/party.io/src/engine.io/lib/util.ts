import { encodeToBase64 } from "../../engine.io-parser/base64-arraybuffer";

export function generateId(): string {
  const buffer = new Uint8Array(15);
  crypto.getRandomValues(buffer);
  return encodeToBase64(buffer).replace(/\//g, "-").replace(/\+/g, "_");
}
