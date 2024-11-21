import React from 'react';

import { YjsEditor } from '@slate-yjs/core';
import { useEditorPlugin } from '@udecode/plate-common/react';

import { BaseYjsPlugin, type YjsConfig } from '../BaseYjsPlugin';

export const YjsAboveEditable: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const { editor, useOption } = useEditorPlugin<YjsConfig>(BaseYjsPlugin);

  const isSynced = useOption('isSynced');

  React.useEffect(() => {
    YjsEditor.connect(editor as any);

    return () => YjsEditor.disconnect(editor as any);
  }, [editor]);

  if (!isSynced) return null;

  return <>{children}</>;
};
