import Debug from 'debug';
import { URL } from 'url';

import { NodeTypeEnum, ShadowsocksNodeConfig } from '../types';
import { decodeStringList, fromUrlSafeBase64 } from './index';

const debug = Debug('surgio:utils:ss');

export const parseSSUri = (str: string): ShadowsocksNodeConfig => {
  debug('Shadowsocks URI', str);

  const scheme = new URL(str);
  const pluginString = scheme.searchParams.get('plugin');
  const userInfo = fromUrlSafeBase64(decodeURIComponent(scheme.username)).split(
    ':',
  );
  const pluginInfo =
    typeof pluginString === 'string'
      ? decodeStringList(pluginString.split(';'))
      : {};

  return {
    type: NodeTypeEnum.Shadowsocks,
    nodeName: decodeURIComponent(scheme.hash.replace('#', '')),
    hostname: scheme.hostname,
    port: scheme.port,
    method: userInfo[0],
    password: userInfo[1],
    ...(pluginInfo['obfs-local']
      ? {
          obfs: pluginInfo.obfs as 'http' | 'tls',
          'obfs-host': pluginInfo['obfs-host'] + '',
        }
      : null),
    ...(pluginInfo['simple-obfs']
      ? {
          obfs: pluginInfo.obfs as 'http' | 'tls',
          'obfs-host': pluginInfo['obfs-host'] + '',
        }
      : null),
    ...(pluginInfo['v2ray-plugin']
      ? {
          obfs: pluginInfo.tls ? 'wss' : 'ws',
          'obfs-host': pluginInfo.host + '',
        }
      : null),
  };
};
