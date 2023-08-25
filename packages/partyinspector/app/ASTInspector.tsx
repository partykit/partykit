import makeClass from "clsx";
import { useTheme, ThemeProvider } from "@devtools-ds/themes";
import type { ThemeableElement } from "@devtools-ds/themes";
import type { ASTNode, ResolvedASTNode } from "@devtools-ds/object-parser";
// @ts-expect-error todo fixme
import { ObjectInspectorItem } from "@devtools-ds/object-inspector/dist/esm/ObjectInspectorItem";

import _styles from "@devtools-ds/object-inspector/src/ObjectInspector.css?inline";

const styles = _styles as unknown as Record<string, string>;

interface ASTInspectorProps extends Omit<ThemeableElement<"div">, "onSelect"> {
  /** JSON data to render in the tree. */
  data: ASTNode;
  /** Depth of the tree that is open at first render. */
  expandLevel: number;
  /** Whether to sort keys like the browsers do. */
  sortKeys: boolean;
  /** Whether to include object Prototypes */
  includePrototypes: boolean;
  /** Callback when a particular node in the tree is actively selected */
  onSelect?: (node?: ASTNode | ResolvedASTNode) => void;
}

/** An emulation of browsers JSON object inspector. */
export const ASTInspector = (props: ASTInspectorProps) => {
  const {
    data,
    expandLevel,
    sortKeys,
    includePrototypes,
    className,
    theme,
    colorScheme,
    onSelect,
    ...html
  } = props;
  const ast = data;
  const { themeClass, currentTheme, currentColorScheme } = useTheme(
    { theme, colorScheme },
    styles
  );

  return (
    <div
      className={makeClass(styles.objectInspector, className, themeClass)}
      {...html}
    >
      {ast && (
        <ThemeProvider theme={currentTheme} colorScheme={currentColorScheme}>
          <ObjectInspectorItem
            ast={ast}
            expandLevel={expandLevel}
            onSelect={onSelect}
          />
        </ThemeProvider>
      )}
    </div>
  );
};

ASTInspector.defaultProps = {
  expandLevel: 0,
  sortKeys: true,
  includePrototypes: true,
};

export default ASTInspector;
