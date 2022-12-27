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

export async function fetchResult<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const mock = mocks.find(([method, mockUrl]) => {
    return mockUrl === url && method === options.method;
  });
  if (mock) {
    return mock[2](url, options) as T;
  }
  throw new Error(`No mock for ${url} ${options.method}`);
}
