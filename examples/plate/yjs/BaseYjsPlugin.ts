import type { WithCursorsOptions } from '@slate-yjs/core';
import type { YPartyKitOptions } from 'y-partykit';

import { type PluginConfig, type UnknownObject, createTSlatePlugin } from '@udecode/plate-common';
import YPartykitProvider from 'y-partykit/provider';

import type { WithYjsOptions } from './withTYjs';

import { withPlateYjs } from './withPlateYjs';

export type YjsPluginOptions<TCursorData extends UnknownObject = UnknownObject> = {
  room: string;

  isConnected: boolean;

  isSynced: boolean;

  provider: YPartykitProvider;

  /** WithCursors options */
  cursorOptions?: WithCursorsOptions<TCursorData>;

  disableCursors?: boolean;
  /**
   *   configuration
   *
   * @required
   */
  yPartykitOptions?: YPartyKitOptions;

  /** WithYjs options */
  yjsOptions?: WithYjsOptions;
};

export type YjsConfig = PluginConfig<'yjs', YjsPluginOptions>;

export const BaseYjsPlugin = createTSlatePlugin<YjsConfig>({
  key: 'yjs',
  extendEditor: withPlateYjs,
  options: {
    room: 'default-test',
    isConnected: false,
    isSynced: false,
    provider: {} as any,
  },
}).extend(({ getOptions, setOption }) => {
  const { yPartykitOptions } = getOptions();

  if (!yPartykitOptions) {
    // it's fine
  }
  const { room } = getOptions();

  /**
   * Create a new websocket-provider instance. As long as this provider, or the
   * connected ydoc, is not destroyed, the changes will be synced to other
   * clients via the connected server.
   */
  const provider = new YPartykitProvider(
    process.env.NODE_ENV === 'production' ? 'https://flow-partykit-editor.Itsnotaka.partykit.dev' : 'localhost:1999',
    room,
  );

  provider.on('synced', () => {
    setOption('isSynced', true);
  });
  provider.on('connected', () => {
    setOption('isConnected', true);
  });
  provider.on('disconnected', () => {
    setOption('isConnected', false);
  });
  return {
    options: { provider },
  };
});
