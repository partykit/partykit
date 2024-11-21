import { toPlatePlugin } from '@udecode/plate-common/react';

import { BaseYjsPlugin } from '../BaseYjsPlugin';
import { YjsAboveEditable } from './YjsAboveEditable';

/** Enables support for real-time collaboration using Yjs. */
export const YjsPlugin = toPlatePlugin(BaseYjsPlugin, {
  render: { aboveEditable: YjsAboveEditable },
});
