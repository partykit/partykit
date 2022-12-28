const API_BASE = process.env.API_BASE || "http://127.0.0.1:8787";

export async function fetchResult<T>(
  api: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${API_BASE}${api}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...options.headers,
    },
  });
  if (res.ok) {
    const resJson = await res.json();
    return resJson; // TODO: check json success/error response
  } else {
    let errorText;
    try {
      errorText = await res.text();
    } catch (e) {
      errorText = `${res.status} ${res.statusText}`;
    }
    throw new Error(errorText);
  }
}
