import type * as Y from "yjs";
import YPartyKitProvider from "./provider";
import { useState, useEffect } from "react";

type UseYPartyKitProviderOptions = {
  host: string;
  room: string;
  party?: string;
  doc?: Y.Doc;
  options: ConstructorParameters<typeof YPartyKitProvider>[3];
};

export default function useYProvider(
  yProviderOptions: UseYPartyKitProviderOptions
) {
  const { host, room, party, doc, options } = yProviderOptions;
  const [provider] = useState<YPartyKitProvider>(
    () =>
      new YPartyKitProvider(host, room, doc, {
        connect: false,
        party,
        ...options,
      })
  );

  useEffect(() => {
    provider.connect();
    return () => provider.disconnect();
  }, [provider]);
  return provider;
}
