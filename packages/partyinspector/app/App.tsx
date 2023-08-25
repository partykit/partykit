//import ASTInspector from "./ASTInspector";
//import type { ASTNode } from "@devtools-ds/object-parser";
import { ObjectInspector } from "@devtools-ds/object-inspector";

const data = __DEVTOOLS_DATA__;
declare const __DEVTOOLS_DATA__: Record<string, unknown>;

function App() {
  return (
    <ObjectInspector
      data={data}
      expandLevel={2}
      sortKeys={true}
      includePrototypes={false}
    />
  );
}

export default App;
