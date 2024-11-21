import { createRoot } from "react-dom/client";
import { Plate } from '@udecode/plate-common/react';
import { withProps } from '@udecode/cn';
import { BasicElementsPlugin } from '@udecode/plate-basic-elements/react';
import {
  BasicMarksPlugin,
  BoldPlugin,
  ItalicPlugin,
  StrikethroughPlugin,
  UnderlinePlugin,
} from '@udecode/plate-basic-marks/react';
import {
  ParagraphPlugin,
  PlateElement,
  PlateLeaf,
  usePlateEditor,
  PlateContent,
} from '@udecode/plate-common/react';
import { cn } from '@udecode/cn';

function Editor({ className, ...props }) {
  return (
    <PlateContent
      className={cn('w-full min-h-[200px] p-4', className)}
      {...props}
    />
  );
}

function useCreateEditor() {
  return usePlateEditor({
    override: {
      components: {
        [BoldPlugin.key]: withProps(PlateLeaf, { as: 'strong' }),
        [ItalicPlugin.key]: withProps(PlateLeaf, { as: 'em' }),
        [ParagraphPlugin.key]: withProps(PlateElement, { as: 'p' }),
        [StrikethroughPlugin.key]: withProps(PlateLeaf, { as: 's' }),
        [UnderlinePlugin.key]: withProps(PlateLeaf, { as: 'u' }),
      },
    },
    plugins: [BasicElementsPlugin, BasicMarksPlugin],
    value: [
      {
        children: [{ text: 'Basic Editor' }],
        type: 'h1',
      },
      {
        children: [
          { text: 'Basic marks: ' },
          { bold: true, text: 'bold' },
          { text: ', ' },
          { italic: true, text: 'italic' },
          { text: ', ' },
          { text: 'underline', underline: true },
          { text: ', ' },
          { strikethrough: true, text: 'strikethrough' },
          { text: '.' },
        ],
        type: ParagraphPlugin.key,
      },
    ],
  });
}

function PlateEditor() {
  const editor = useCreateEditor();

  return (
    <Plate editor={editor}>
      <Editor placeholder="Type..." />
    </Plate>
  );
}

function App() {
  return (
    <div className="h-screen w-full">
      <PlateEditor />
    </div>
  );
}

const root = createRoot(document.getElementById("root"));
if (!root) throw new Error("Root element not found");
root.render(<App />);