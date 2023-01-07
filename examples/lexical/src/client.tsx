/** @jsx React.createElement */

import * as React from "react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { PlainTextPlugin } from "@lexical/react/LexicalPlainTextPlugin";
import { CollaborationPlugin } from "@lexical/react/LexicalCollaborationPlugin";
import LexicalErrorBoundary from "@lexical/react/LexicalErrorBoundary";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";

import { createRoot } from "react-dom/client";

const connectionId = crypto.randomUUID();

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const root = createRoot(document.getElementById("root")!);
root.render(<Editor />);

function Editor() {
  const initialConfig = {
    editorState: null,
    namespace: "oops",
    nodes: [],
    onError(error: Error) {
      throw error;
    },
  };

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <PlainTextPlugin
        contentEditable={<ContentEditable />}
        placeholder={<div>Enter some text...</div>}
        ErrorBoundary={LexicalErrorBoundary}
      />
      <CollaborationPlugin
        id="yjs"
        providerFactory={(id, yjsDocMap) => {
          const doc = new Y.Doc();
          yjsDocMap.set(id, doc);

          const provider = new WebsocketProvider(
            "ws://localhost:1999/party",
            id,
            doc,
            {
              params: {
                _pk: connectionId,
              },
            }
          );

          return provider;
        }}
        shouldBootstrap={true}
      />
    </LexicalComposer>
  );
}
