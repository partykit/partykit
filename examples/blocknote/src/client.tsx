/// <reference no-default-lib="true"/>
/// <reference lib="dom"/>

import * as React from "react";
import YPartyKitProvider from "y-partykit/provider";
import * as Y from "yjs";
import { createRoot } from "react-dom/client";
import { BlockNoteView, useBlockNote } from "@blocknote/react";
import "@blocknote/core/style.css";
import { getRandomUser } from "./randomUser";

declare const PARTYKIT_HOST: string | undefined;

const partykitHost =
  typeof PARTYKIT_HOST === "undefined" ? "localhost:1999" : PARTYKIT_HOST;

const doc = new Y.Doc();
const provider = new YPartyKitProvider(
  partykitHost || "localhost:1999",
  "my-document-id",
  doc
);

function Editor() {
  const editor = useBlockNote({
    collaboration: {
      // The Yjs Provider responsible for transporting updates:
      provider,
      // Where to store BlockNote data in the Y.Doc:
      fragment: doc.getXmlFragment("document-store"),
      // Information (name and color) for this user:
      user: getRandomUser(),
    },
  });
  return <BlockNoteView editor={editor} />;
}

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const root = createRoot(document.getElementById("root")!);
root.render(<Editor />);
