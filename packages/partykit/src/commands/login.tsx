import React from "react";
import { getUser, type LoginMethod } from "../config";

import asyncCache from "../async-cache";
import { Text } from "ink";

const read = asyncCache();

export default function Login({ method }: { method?: LoginMethod }) {
  const userConfig = read("get-user", () => getUser(method)) as Awaited<
    ReturnType<typeof getUser>
  >;

  return (
    <Text>
      Logged in as{" "}
      <Text bold>
        {
          // eslint-disable-next-line deprecation/deprecation
          userConfig.login
        }
      </Text>
    </Text>
  );
}
