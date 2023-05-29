import React from "react";
import { getUser } from "../config";
import asyncCache from "../async-cache";
import { Text } from "ink";

const read = asyncCache();

export default function Login() {
  const userConfig = read("get-user", getUser) as Awaited<
    ReturnType<typeof getUser>
  >;

  return (
    <Text>
      Logged in as <Text bold>{userConfig.login}</Text>
    </Text>
  );
}
