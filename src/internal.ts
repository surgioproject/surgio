import { loadConfig, setConfig, getConfig } from './utils/config';
import { loadRemoteSnippetList } from './utils/remote-snippet';

export * as types from './types';

const utils = {
  loadRemoteSnippetList,
} as const;

const config = {
  loadConfig,
  setConfig,
  getConfig,
} as const;

export { utils, config };
