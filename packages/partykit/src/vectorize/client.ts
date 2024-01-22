import { getConfig, getUser } from "../config";
import { fetchResult } from "../fetchResult";

import type {
  VectorizeDistanceMetric,
  VectorizeIndex,
  VectorizeIndexDetails,
  // @ts-expect-error hmm odd
  VectorizePreset,
  VectorizeQueryOptions,
  VectorizeVector,
  VectorizeVectorMutation
} from "@cloudflare/workers-types";
import type { FormData } from "undici";

interface VectorizeIndexResult extends VectorizeIndexDetails {
  readonly created_on: string;
  readonly modified_on: string;
  readonly config: IndexConfigResult;
}

interface IndexConfigResult {
  metric: VectorizeDistanceMetric;
  dimensions: number;
}

export async function createIndex(options: {
  config: string | undefined;
  body: {
    name: string;
    config:
      | { preset: VectorizePreset }
      | {
          metric: VectorizeDistanceMetric;
          dimensions: number;
        };
    description: string | undefined;
  };
}): Promise<VectorizeIndexResult> {
  const user = await getUser();
  const config = getConfig(options.config);

  return fetchResult<VectorizeIndexResult>(
    `/vectorize/${
      config.team ||
      // eslint-disable-next-line deprecation/deprecation
      user.login
    }/indexes`,
    {
      user,
      method: "POST",
      body: JSON.stringify(options.body)
    }
  );
}

export async function deleteIndex(options: {
  config: string | undefined;
  indexName: string;
}): Promise<void> {
  const user = await getUser();
  const config = getConfig(options.config);
  return fetchResult<void>(
    `/vectorize/${
      config.team ||
      // eslint-disable-next-line deprecation/deprecation
      user.login
    }/indexes/${options.indexName}`,
    {
      user,
      method: "DELETE"
    }
  );
}

export async function getIndex(options: {
  config: string | undefined;
  indexName: string;
}): Promise<VectorizeIndexResult> {
  const user = await getUser();
  const config = getConfig(options.config);
  return fetchResult(
    `/vectorize/${
      config.team ||
      // eslint-disable-next-line deprecation/deprecation
      user.login
    }/indexes/${options.indexName}`,
    {
      user,
      method: "GET"
    }
  );
}

export async function listIndexes(options: {
  config: string | undefined;
}): Promise<VectorizeIndexResult[]> {
  const user = await getUser();
  const config = getConfig(options.config);
  return fetchResult<VectorizeIndexResult[]>(
    // eslint-disable-next-line deprecation/deprecation
    `/vectorize/${config.team || user.login}/indexes`,
    {
      user,
      method: "GET"
    }
  );
}

export async function updateIndex(options: {
  config: string | undefined;
  indexName: string;
  body: VectorizeIndex;
}): Promise<VectorizeIndexResult> {
  const user = await getUser();
  const config = getConfig(options.config);
  return fetchResult<VectorizeIndexResult>(
    `/vectorize/${
      config.team ||
      // eslint-disable-next-line deprecation/deprecation
      user.login
    }/indexes/${options.indexName}`,
    {
      user,
      method: "PUT",
      body: JSON.stringify(options.body)
    }
  );
}

export async function insertIntoIndex(options: {
  config: string | undefined;
  indexName: string;
  body: FormData;
}): Promise<VectorizeVectorMutation> {
  const user = await getUser();
  const config = getConfig(options.config);

  return fetchResult(
    `/vectorize/${
      config.team ||
      // eslint-disable-next-line deprecation/deprecation
      user.login
    }/indexes/${options.indexName}/insert`,
    {
      user,
      method: "POST",
      body: options.body
    }
  );
}

export async function upsertIntoIndex(options: {
  config: string | undefined;
  indexName: string;
  body: FormData;
}): Promise<VectorizeVectorMutation> {
  const user = await getUser();
  const config = getConfig(options.config);

  return fetchResult(
    `/vectorize/${
      config.team ||
      // eslint-disable-next-line deprecation/deprecation
      user.login
    }/indexes/${options.indexName}/upsert`,
    {
      user,
      method: "POST",
      body: options.body
    }
  );
}

export async function queryIndex(options: {
  config: string | undefined;
  indexName: string;
  query: VectorizeVector;
  options?: VectorizeQueryOptions;
}): Promise<VectorizeIndex> {
  const user = await getUser();
  const config = getConfig(options.config);

  const payload = {
    query: options.query,
    options: options
  };

  return fetchResult(
    `/vectorize/${
      config.team ||
      // eslint-disable-next-line deprecation/deprecation
      user.login
    }/indexes/${options.indexName}/query`,
    {
      user,
      method: "POST",
      body: JSON.stringify(payload)
    }
  );
}

export async function getByIds(options: {
  config: string | undefined;
  indexName: string;
  ids: Array<string>;
}): Promise<VectorizeIndex> {
  const user = await getUser();
  const config = getConfig(options.config);

  return fetchResult(
    `/vectorize/${
      config.team ||
      // eslint-disable-next-line deprecation/deprecation
      user.login
    }/indexes/${options.indexName}/getByIds`,
    {
      user,
      method: "POST",
      body: JSON.stringify(options.ids)
    }
  );
}

export async function deleteByIds(options: {
  config: string | undefined;
  indexName: string;
  ids: Array<string>;
}): Promise<VectorizeIndex> {
  const user = await getUser();
  const config = getConfig(options.config);

  return fetchResult(
    `/vectorize/${
      config.team ||
      // eslint-disable-next-line deprecation/deprecation
      user.login
    }/indexes/${options.indexName}/deleteIds`,
    {
      user,
      method: "POST",
      body: JSON.stringify(options.ids)
    }
  );
}
