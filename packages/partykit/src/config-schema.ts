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
  "tsx"
] as const;

function isValidWorkerName(name: string) {
  const isValid = /^[a-z0-9_-]+$/.test(name);
  if (!isValid) console.warn(`Invalid party name: ${name}`);
  return isValid;
}

export const schema = z
  .object({
    $schema: z.string().optional(),
    team: z.string().optional(),
    name: z
      .string()
      .refine(isValidWorkerName, {
        message: "must satisfy /^[a-z0-9_-]+$/"
      })
      .optional(),
    main: z.string().optional(),
    port: z.number().optional(),
    preview: z.string().optional(),
    crons: z.record(z.string()).optional(), // todo: validate crons
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
                alias: z.record(z.string()).optional(),
                format: z.enum(["esm", "cjs", "iife"]).optional(),
                live: z.boolean().optional(),
                sourcemap: z.boolean().optional(),
                define: z.record(z.string()).optional(),
                loader: z.record(z.enum(loaders)).optional()
              })
            ])
            .optional(),
          include: z.array(z.string()).optional(),
          exclude: z.array(z.string()).optional(),
          browserTTL: z.union([z.null(), z.number()]).optional(),
          edgeTTL: z.union([z.null(), z.number()]).optional(),
          singlePageApp: z.boolean().optional()
        })
      ])
      .optional(),
    persist: z.union([z.boolean(), z.string()]).optional(),
    vars: z.record(z.unknown()).optional(),
    define: z.record(z.string()).optional(),
    parties: z
      .record(z.string())
      .refine((object) => Object.keys(object).every(isValidWorkerName), {
        message: "must satisfy /^[a-z0-9_-]+$/"
      })
      .optional(),
    build: z
      .object({
        command: z.string().optional(),
        cwd: z.string().optional(),
        watch: z.union([z.string(), z.array(z.string())]).optional(),
        alias: z.record(z.string()).optional()
      })
      .strict()
      .optional(),
    compatibilityDate: z.string().optional(),
    compatibilityFlags: z.array(z.string()).optional(),
    minify: z.boolean().optional(),
    ai: z
      .union([
        z.boolean(),
        z.object({
          apiGateway: z.string().optional(),
          apiToken: z.string().optional(),
          apiAccount: z.string().optional()
        })
      ])
      .optional(),
    domain: z.string().optional(),
    vectorize: z
      .record(
        z.union([
          z.string(),
          z.object({
            index_name: z.string()
            // TODO: add more fields, probably for provisioning
          })
        ])
      )
      .optional(),
    logpush: z.boolean().optional(),
    tailConsumers: z.array(z.string()).optional(),
    analytics: z.string().optional(),
    bindings: z
      .object({
        r2: z.record(z.string()).optional(),
        kv: z.record(z.string()).optional()
      })
      .optional(),
    placement: z
      .object({
        mode: z.enum(["smart"])
      })
      .optional(),
    observability: z
      .object({
        enabled: z.boolean().optional(),
        head_sampling_rate: z.number().optional()
      })
      .optional()
  })
  .strict();

export type Config = z.infer<typeof schema>;
