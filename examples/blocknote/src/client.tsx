import * as React from "react";
import { createRoot } from "react-dom/client";
import YPartyKitProvider from "y-partykit/provider";
import { BlockNoteView, useCreateBlockNote } from "@blocknote/react";
import * as Y from "yjs";

import "@blocknote/core/fonts/inter.css";
import "@blocknote/react/style.css";

import { getRandomUser } from "./randomUser";

declare const PARTYKIT_HOST: string;

const doc = new Y.Doc();
const provider = new YPartyKitProvider(PARTYKIT_HOST, "my-document-id", doc);

function Editor() {
  const editor = useCreateBlockNote({
    collaboration: {
      // The Yjs Provider responsible for transporting updates:
      provider,
      // Where to store BlockNote data in the Y.Doc:
      fragment: doc.getXmlFragment("document-store"),
      // Information (name and color) for this user:
      user: getRandomUser()
    }
  });
  return <BlockNoteView editor={editor} />;
}

const root = createRoot(document.getElementById("root")!);
root.render(<Editor />);
