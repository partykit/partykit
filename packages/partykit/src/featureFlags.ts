import path from "path";
import os from "os";
import fs from "fs";
import z from "zod";
import JSON5 from "json5";
import { fetchResult } from "./fetchResult";

const USER_FLAGS_PATH = path.join(os.homedir(), ".partykit", "settings.json");

const flagsSchema = z.object({
  defaultLoginMethod: z.enum(["clerk", "github"]),
  supportedLoginMethods: z.array(z.enum(["clerk", "github"])),
});

const defaultFlags: Flags = {
  defaultLoginMethod: "github",
  supportedLoginMethods: ["clerk", "github"],
};

let cachedFlags: Flags | undefined;

type Flags = z.infer<typeof flagsSchema>;

export function getFlags(): Flags {
  if (!cachedFlags) {
    try {
      // use previously cached flags if available
      cachedFlags = flagsSchema.parse(
        JSON5.parse(fs.readFileSync(USER_FLAGS_PATH, "utf8"))
      );

      // fetch remote flags and cache them locally for offline use for next time
      void fetchFlags().then((flags) => {
        cachedFlags = flags;
      });
    } catch (e) {
      // ignore, fall back to default settings
    }
  }

  return {
    ...defaultFlags,
    ...(cachedFlags || {}),
  };
}

async function fetchFlags(): Promise<Flags> {
  const flags = flagsSchema.parse(await fetchResult("/flags"));
  fs.mkdirSync(path.dirname(USER_FLAGS_PATH), { recursive: true });
  fs.writeFileSync(USER_FLAGS_PATH, JSON.stringify(cachedFlags, null, 2));
  return flags;
}
