import type {
  VectorFloatArray,
  VectorizeIndex,
  VectorizeIndexDetails,
  VectorizeMatches,
  VectorizeQueryOptions,
  VectorizeVector,
  VectorizeVectorMutation
} from "@cloudflare/workers-types";

declare const PARTYKIT_API_BASE: string;

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
  const res = await fetch(`${PARTYKIT_API_BASE}${api}`, {
    ...fetchOptions,
    headers: {
      ...extraHeaders,
      ...fetchOptions.headers
    }
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

const VECTORIZE_MAX_BATCH_SIZE = 1_000;
const VECTORIZE_UPSERT_BATCH_SIZE = VECTORIZE_MAX_BATCH_SIZE;
const VECTORIZE_MAX_UPSERT_VECTOR_RECORDS = 100_000;

async function* getBatchFromArray(
  array: VectorizeVector[],
  batchSize = VECTORIZE_UPSERT_BATCH_SIZE
) {
  let batch: string[] = [];
  for await (const line of array) {
    if (batch.push(JSON.stringify(line)) >= batchSize) {
      yield batch;
      batch = [];
    }
  }

  yield batch;
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
    return this.fetch(
      `/vectorize/${this.namespace}/indexes/${this.index_name}`,
      {
        method: "GET"
      }
    );
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
          ...options
        }),
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
  }

  async insert(
    vectors: VectorizeVector[],
    upsert = false
  ): Promise<VectorizeVectorMutation> {
    let vectorInsertCount = 0;
    const insertedIds: string[] = [];
    for await (const batch of getBatchFromArray(vectors)) {
      const formData = new FormData();
      formData.append(
        "vectors",
        new File([batch.join(`\n`)], "vectors.ndjson", {
          type: "application/x-ndjson"
        })
      );

      const idxPart = await this.fetch<VectorizeVectorMutation>(
        `/vectorize/${this.namespace}/indexes/${this.index_name}/${
          upsert ? "upsert" : "insert"
        }`,
        {
          method: "POST",
          body: formData
        }
      );
      vectorInsertCount += idxPart.count;
      insertedIds.push(...idxPart.ids);

      if (vectorInsertCount > VECTORIZE_MAX_UPSERT_VECTOR_RECORDS) {
        console.warn(
          `🚧 While Vectorize is in beta, we've limited uploads to 100k vectors per run. You may run this again with another batch to upload further`
        );
        break;
      }
    }

    return {
      count: vectorInsertCount,
      ids: insertedIds
    };
  }

  async upsert(vectors: VectorizeVector[]): Promise<VectorizeVectorMutation> {
    return this.insert(vectors, true);
  }

  async deleteByIds(_ids: string[]): Promise<VectorizeVectorMutation> {
    throw new Error(
      "This method is not implemented in local dev, but will work when deployed"
    );
  }

  async getByIds(_ids: string[]): Promise<VectorizeVector[]> {
    throw new Error(
      "This method is not implemented in local dev, but will work when deployed."
    );
  }
}
