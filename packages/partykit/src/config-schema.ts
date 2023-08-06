// we keep this file separate so that we can import it
// cleanly in the build script to generate a json schema
// without all theo ther the baggage

import { z } from "zod";

export const schema = z
  .object({
    $schema: z.string().optional(),
    account: z.string().optional(),
    name: z.string().optional(),
    main: z.string().optional(),
    port: z.number().optional(),
    assets: z
      .union([
        z.string(),
        z.object({
          path: z.string().optional(),
          include: z.array(z.string()).optional(),
          exclude: z.array(z.string()).optional(),
          browserTTL: z.number().optional(),
          edgeTTL: z.number().optional(),
          serveSinglePageApp: z.boolean().optional(),
        }),
      ])
      .optional(),
    persist: z.union([z.boolean(), z.string()]).optional(),
    vars: z.record(z.unknown()).optional(),
    define: z.record(z.string()).optional(),
    parties: z.record(z.string()).optional(),
    build: z
      .object({
        command: z.string().optional(),
        cwd: z.string().optional(),
        watch: z.string().optional(),
      })
      .strict()
      .optional(),
    compatibilityDate: z.string().optional(),
    compatibilityFlags: z.array(z.string()).optional(),
    minify: z.boolean().optional(),
  })
  .strict();

export type Config = z.infer<typeof schema>;
