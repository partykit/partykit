import { getConfig, getUser } from "./config";
import { fetchResult } from "./fetchResult";

export async function listModels(options: { config: string | undefined }) {
  const user = await getUser();
  const config = getConfig(options.config);
  const models = await fetchResult<{
    result: {
      name: string;
      description: string;
    }[];
  }>(
    // eslint-disable-next-line deprecation/deprecation
    `/ai/${config.team || user.login}/list-models`,
    { user }
  );
  return models.result;
}
