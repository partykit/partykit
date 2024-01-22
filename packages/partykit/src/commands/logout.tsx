import React from "react";
import { Text } from "ink";

import asyncCache from "../async-cache";
import { logout } from "../config";

const read = asyncCache();

export default function () {
  read("logout", logout) as Awaited<ReturnType<typeof logout>>;

  return <Text>Logged out</Text>;
}
