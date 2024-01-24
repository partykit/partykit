import { getUser } from "../config";
import { fetchResult } from "../fetchResult";
import { getCloudflareAccountIdFromEnv } from "./auth-variables";
import { UserError as ParseUserError } from "./parse";

export type ChooseAccountItem = {
  id: string;
  name: string;
};

/**
 * Infer a list of available accounts for the current user.
 */
export async function getAccountChoices(): Promise<ChooseAccountItem[]> {
  const user = await getUser();
  const accountIdFromEnv = getCloudflareAccountIdFromEnv();
  if (accountIdFromEnv) {
    return [{ id: accountIdFromEnv, name: "" }];
  } else {
    try {
      const response = await fetchResult<
        {
          account: ChooseAccountItem;
        }[]
        // eslint-disable-next-line deprecation/deprecation
      >(`/cf/${user.login}/memberships`, { user });
      const accounts = response.map((r) => r.account);
      if (accounts.length === 0) {
        throw new ParseUserError(
          "Failed to automatically retrieve account IDs for the logged in user.\n" +
            "In a non-interactive environment, it is mandatory to specify an account ID, either by assigning its value to CLOUDFLARE_ACCOUNT_ID, or as `account_id` in your `wrangler.toml` file."
        );
      } else {
        return accounts;
      }
    } catch (err) {
      if ((err as { code: number }).code === 9109) {
        throw new ParseUserError(
          `Failed to automatically retrieve account IDs for the logged in user.
You may have incorrect permissions on your API token. You can skip this account check by adding an \`account_id\` in your \`wrangler.toml\`, or by setting the value of CLOUDFLARE_ACCOUNT_ID"`
        );
      } else throw err;
    }
  }
}
