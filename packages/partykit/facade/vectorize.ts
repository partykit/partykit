import type {
  VectorFloatArray,
  VectorizeIndex,
  VectorizeIndexDetails,
  VectorizeMatches,
  VectorizeQueryOptions,
  VectorizeVector,
  VectorizeVectorMutation,
} from "@cloudflare/workers-types";

// const API_BASE = process.env.PARTYKIT_API_BASE || PARTYKIT_API_BASE;
const API_BASE = "http://127.0.0.1:8787";

export type VectorizeLocalDevHeaders = {
  "User-Agent": string;
  "X-PartyKit-Version": string;
  "X-CLOUDFLARE-ACCOUNT-ID": string;
  "X-CLOUDFLARE-API-TOKEN": string;
  Authorization: string;
  "X-PartyKit-User-Type": string;
};

type FetchInit = RequestInit & {
  extraHeaders: VectorizeLocalDevHeaders;
};

async function fetchResult<T>(api: string, options: FetchInit): Promise<T> {
  const { extraHeaders, ...fetchOptions } = options;
  const res = await fetch(`${API_BASE}${api}`, {
    ...fetchOptions,
    headers: {
      "Content-Type": "application/json",
      ...extraHeaders,
      ...fetchOptions.headers,
    },
  });

  if (res.ok) {
    const resJson = (await res.json()) as T;
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

export type VectorizeClientOptions = {
  index_name: string;
  headers: VectorizeLocalDevHeaders;
  namespace: string;
};

export class VectorizeClient implements VectorizeIndex {
  headers: VectorizeLocalDevHeaders;
  namespace: string;
  index_name: string;
  constructor(options: VectorizeClientOptions) {
    this.index_name = options.index_name;
    this.headers = options.headers;
    this.namespace = options.namespace;
  }

  fetch<T>(api: string, init: RequestInit): Promise<T> {
    return fetchResult<T>(api, { ...init, extraHeaders: this.headers });
  }

  describe(): Promise<VectorizeIndexDetails> {
    throw new Error("Method not implemented.");
  }
  async query(
    vector: VectorFloatArray | number[],
    options?: VectorizeQueryOptions
  ): Promise<VectorizeMatches> {
    return this.fetch<VectorizeMatches>(
      `/vectorize/${this.namespace}/indexes/${this.index_name}/query`,
      {
        method: "POST",
        body: JSON.stringify({
          vector,
          ...options,
        }),
      }
    );
  }

  async insert(_vectors: VectorizeVector[]): Promise<VectorizeVectorMutation> {
    throw new Error("Method not implemented.");
  }

  async upsert(_vectors: VectorizeVector[]): Promise<VectorizeVectorMutation> {
    throw new Error("Method not implemented.");
  }

  async deleteByIds(_ids: string[]): Promise<VectorizeVectorMutation> {
    throw new Error("Method not implemented.");
  }

  async getByIds(_ids: string[]): Promise<VectorizeVector[]> {
    throw new Error("Method not implemented.");
  }
}
