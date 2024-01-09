import { createRoot } from "react-dom/client";
import { CopilotProvider } from "@copilotkit/react-core";
import "@copilotkit/react-textarea/styles.css"; // also import this if you want to use the CopilotTextarea component
import { CopilotTextarea } from "@copilotkit/react-textarea";
import { useState } from "react";
import "./styles.css";

function App() {
  return (
    <CopilotProvider chatApiEndpoint="/autocomplete">
      <TextArea />
    </CopilotProvider>
  );
}

function TextArea() {
  const [prompt, setPrompt] = useState("Speak like a pirate"); // this is the prompt that will be sent to the Copilot API
  const [text, setText] = useState("");

  return (
    <>
      <input
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        className="prompt"
      />
      <CopilotTextarea
        className="px-4 py-4"
        value={text}
        onValueChange={(value: string) => setText(value)}
        placeholder=""
        autosuggestionsConfig={{
          textareaPurpose: prompt,
          chatApiConfigs: {
            suggestionsApiConfig: {
              forwardedParams: {
                // max_tokens: 20,
                stop: [".", "?", "!"],
              },
            },
          },
        }}
      />
    </>
  );
}

createRoot(document.getElementById("app")!).render(<App />);
