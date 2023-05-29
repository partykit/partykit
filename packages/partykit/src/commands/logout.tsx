import React from "react";
import { logout } from "../config";
import asyncCache from "../async-cache";
import { Text } from "ink";

const read = asyncCache();

export default function () {
  read("logout", logout) as Awaited<ReturnType<typeof logout>>;

  return <Text>Logged out</Text>;
}
