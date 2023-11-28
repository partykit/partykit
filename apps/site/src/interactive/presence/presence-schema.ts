import { encode, decode } from "@msgpack/msgpack";
import z from "zod";

export type Cursor = {
  x: number;
  y: number;
  pointer: "mouse" | "touch";
};

// user-modifiable fields
export type Presence = {
  cursor: Cursor | null;
  message: string | null;
  name: string;
  color: string;
  spotlightColor?: string;
};

// set on the server, read-only for the duration of the session
export type Metadata = {
  country: string | null;
};

// additional fields that are set by the server
// and do not change for the duration of the session
export type User = {
  presence: Presence;
  metadata: Metadata;
};

export type PartyMessage =
  | {
      type: "sync";
      users: { [id: string]: User };
    }
  | {
      type: "changes";
      add?: { [id: string]: User };
      presence?: { [id: string]: Presence };
      remove?: string[];
    };

export type ClientMessage =
  | {
      // joining is explicit so that presence can be initialized
      type: "join";
      presence: Presence;
    }
  | {
      type: "update";
      presence: Partial<Presence>;
    };

// Schema created with https://transform.tools/typescript-to-zod

export const cursorSchema = z.object({
  x: z.number(),
  y: z.number(),
  pointer: z.union([z.literal("mouse"), z.literal("touch")]),
});

export const presenceSchema = z.object({
  cursor: cursorSchema.nullable(),
  message: z.string().nullable(),
  name: z.string(),
  color: z.string(),
  spotlightColor: z.string().optional(),
});

export const metadataSchema = z.object({
  country: z.string().nullable(),
});

export const userSchema = z.object({
  presence: presenceSchema,
  metadata: metadataSchema,
});

export const partyMessageSchema = z.union([
  z.object({
    type: z.literal("sync"),
    users: z.record(userSchema),
  }),
  z.object({
    type: z.literal("changes"),
    add: z.record(userSchema).optional(),
    presence: z.record(presenceSchema).optional(),
    remove: z.array(z.string()).optional(),
  }),
]);

export const clientMessageSchema = z.union([
  z.object({
    type: z.literal("join"),
    presence: presenceSchema,
  }),
  z.object({
    type: z.literal("update"),
    presence: presenceSchema.partial(),
  }),
]);

// parse incoming message (supports json and msgpack)
export function decodeMessage(message: string | ArrayBufferLike) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return typeof message === "string" ? JSON.parse(message) : decode(message);
}

// creates a msgpack message
export function encodePartyMessage(data: z.infer<typeof partyMessageSchema>) {
  //return encode(partyMessageSchema.parse(data));
  return encode(data);
}

export function encodeClientMessage(data: z.infer<typeof clientMessageSchema>) {
  //return encode(clientMessageSchema.parse(data));
  return encode(data);
}
