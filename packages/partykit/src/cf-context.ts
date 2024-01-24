import { AsyncLocalStorage } from "node:async_hooks";

export const cfContext = new AsyncLocalStorage<
  | {
      account_id: string;
      api_token: string;
    }
  | undefined
>();

export function wrapWithCFContext<T>(fn: () => Promise<T>): Promise<T> {
  return cfContext.run(
    {
      account_id: process.env.CLOUDFLARE_ACCOUNT_ID || "",
      api_token: process.env.CLOUDFLARE_API_TOKEN || ""
    },
    fn
  );
}
