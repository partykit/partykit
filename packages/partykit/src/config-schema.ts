// we keep this file separate so that we can import it
// cleanly in the build script to generate a json schema
// without all the other baggage

import { z } from "zod";

const loaders = [
  "base64",
  "binary",
  "copy",
  "css",
  "dataurl",
  "default",
  "empty",
  "file",
  "js",
  "json",
  "jsx",
  "local-css",
  "text",
  "ts",
  "tsx",
] as const;

export const schema = z
  .object({
    $schema: z.string().optional(),
    account: z.string().optional(),
    name: z.string().optional(),
    main: z.string().optional(),
    ip: z.string().optional(),
    port: z.number().optional(),
    preview: z.string().optional(),
    serve: z
      .union([
        z.string(),
        z.object({
          path: z.string().optional(),
          build: z
            .union([
              z.string(),
              z.object({
                entry: z.union([z.string(), z.array(z.string())]).optional(),
                bundle: z.boolean().default(true).optional(),
                splitting: z.boolean().default(true).optional(),
                external: z.array(z.string()).optional(),
                outdir: z.string().optional(),
                minify: z.boolean().optional(),
                format: z.enum(["esm", "cjs", "iife"]).optional(),
                sourcemap: z.boolean().optional(),
                define: z.record(z.string()).optional(),
                loader: z.record(z.enum(loaders)).optional(),
              }),
            ])
            .optional(),
          include: z.array(z.string()).optional(),
          exclude: z.array(z.string()).optional(),
          browserTTL: z.number().optional(),
          edgeTTL: z.number().optional(),
          singlePageApp: z.boolean().optional(),
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
