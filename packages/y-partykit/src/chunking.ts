// This file contains a shared implementation of chunking logic for binary
// WebSocket messages. Because the PartyKit platform limits individual
// WebSocket messages to 1MB, we need to split larger messages into chunks.
export const CHUNK_MAX_SIZE = 1_000_000;

const BATCH_SENTINEL = "y-pk-batch";
const TRACE_ENABLED = false;
const trace = (...args: unknown[]) => TRACE_ENABLED && console.log(...args);

let warnedAboutLargeMessage = false;

type MessageData = ArrayBufferLike | string;
type MessageHandler = (message: { data: MessageData }) => void;
type Batch = {
  id: string;
  type: "start" | "end";
  size: number;
  count: number;
};

/**
 * Takes an ArrayBuffer and sends it in chunks to the provided send function,
 * along with a start and end marker.
 *
 * 1. The sender splits the message into chunks of 1MB or less.
 * 2. The sender sends a chunk start marker
 * 3. The sender sends each chunk as a individual packet
 * 4. The sender sends a chunk end marker
 */
export const sendChunked = (data: ArrayBufferLike, ws: WebSocket) => {
  if (data.byteLength <= CHUNK_MAX_SIZE) {
    ws.send(data);
    return;
  }

  if (!warnedAboutLargeMessage) {
    console.warn(
      "[y-partykit]",
      "The Y.js update size exceeds 1MB, which is the maximum size for an individual update. The update will be split into chunks. This is an experimental feature.",
      `Message size: ${(data.byteLength / 1000 / 1000).toFixed(1)}MB`
    );
    warnedAboutLargeMessage = true;
  }

  const id = (Date.now() + Math.random()).toString(36).substring(10);
  const chunks = Math.ceil(data.byteLength / CHUNK_MAX_SIZE);

  ws.send(
    serializeBatchMarker({
      id,
      type: "start",
      size: data.byteLength,
      count: chunks
    })
  );

  let sentSize = 0;
  let sentChunks = 0;
  for (let i = 0; i < chunks; i++) {
    const chunk = data.slice(CHUNK_MAX_SIZE * i, CHUNK_MAX_SIZE * (i + 1));
    ws.send(chunk);
    sentChunks += 1;
    sentSize += chunk.byteLength;
  }

  ws.send(
    serializeBatchMarker({
      id,
      type: "end",
      size: sentSize,
      count: sentChunks
    })
  );
};

/**
 * Creates a WebSocket message handler that can handle chunked messages.
 *
 * Reassembles the chunks into a single ArrayBuffer and pass it to the
 * provided receive function.
 *
 * 1. The server receives a chunk start marker
 * 2. The server pools each chunk until it receives a chunk end marker
 * 3. The server validates that the received data matches the expected size
 * 4. The server forwards the message to handlers
 */
export const handleChunked = (
  receive: (data: MessageData) => void
): MessageHandler => {
  let batch: ArrayBuffer[] | undefined;
  let start: Batch | undefined;

  return (message) => {
    if (typeof message === "string") {
      return;
    }
    if (isBatchSentinel(message.data)) {
      const marker = parseBatchMarker(message.data);
      if (marker.type === "start") {
        batch = [];
        start = marker;
      }

      if (marker.type === "end") {
        if (batch) {
          try {
            // validate start and end markers match
            assertEquality(start?.id, marker.id, "client id");
            assertEquality(start?.count, marker.count, "client counts");
            assertEquality(start?.size, marker.size, "client size");

            // combine chunks into single buffer
            const size = batch.reduce(
              (sum, buffer) => sum + buffer.byteLength,
              0
            );
            const bytes = new Uint8Array(size);
            let bytesWritten = 0;
            for (const chunk of batch) {
              bytes.set(new Uint8Array(chunk), bytesWritten);
              bytesWritten += chunk.byteLength;
            }

            // validate data as read matches expected
            assertEquality(marker.count, batch.length, "received batch count");
            assertEquality(marker.size, bytesWritten, "client size");

            receive(bytes as unknown as ArrayBuffer);
          } catch (e) {
            console.error(e);
            throw e;
          } finally {
            batch = undefined;
            start = undefined;
          }
        }
      }
    } else if (batch) {
      batch.push(message.data as unknown as ArrayBuffer);
    } else {
      receive(new Uint8Array(message.data) as unknown as ArrayBuffer);
    }
  };
};

function assertEquality(expected: unknown, actual: unknown, label: string) {
  if (expected !== actual) {
    throw new Error(
      `Mismatching ${label}! Expected ${expected}, got ${actual}`
    );
  } else {
    trace(`Matching ${label}: ${expected}`);
  }
}

/** Checks whether a message is batch marker */
function isBatchSentinel(msg: MessageData): msg is string {
  return typeof msg === "string" && msg.startsWith(BATCH_SENTINEL);
}

/** Encodes a batch marker message so that it can be safely parsed */
function serializeBatchMarker(batch: Batch): string {
  return `${BATCH_SENTINEL}#${JSON.stringify(batch)}`;
}

/** Parses a batch marker messages and throws if its invalid */
export function parseBatchMarker(msg: string) {
  const [sentinel, data] = msg.split("#", 2);
  if (sentinel !== BATCH_SENTINEL) {
    throw new Error("Unexpected batch marker: " + msg);
  }

  const batch = JSON.parse(data) as Batch;
  if (batch.type !== "start" && batch.type !== "end") {
    throw new Error("Unexpected batch data: " + msg);
  }

  return batch;
}
