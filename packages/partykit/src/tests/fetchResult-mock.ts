import type { UserConfig } from "../config";

type Method = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

const mocks: [
  Method,
  string,
  (url: string, options: RequestInit | undefined) => unknown
][] = [];

export function mockFetchResult<T>(
  method: Method,
  url: string,
  reply: (url: string, options: RequestInit | undefined) => T
) {
  mocks.push([method, url, reply]);
}

export function clearMocks() {
  mocks.splice(0);
}

export async function fetchResultAsUser<T>(
  user: UserConfig,
  url: string,
  options: RequestInit = {}
): Promise<T> {
  return fetchResult<T>(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${user.access_token}`,
      "X-PartyKit-User-Type": user.type,
      ...(options.headers ?? {}),
    },
  });
}

export async function fetchResult<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const mock = mocks.find(([method, mockUrl]) => {
    return mockUrl === url && method === (options.method || "GET");
  });
  if (mock) {
    return mock[2](url, options) as T;
  }
  throw new Error(`No mock for ${url} ${options.method || "GET"}`);
}
