import Debug from 'debug';
import { default as legacyUrl } from 'url';

import { NodeTypeEnum, ShadowsocksNodeConfig } from '../types';
import { decodeStringList, fromUrlSafeBase64 } from './index';

const debug = Debug('surgio:utils:ss');

export const parseSSUri = (str: string): ShadowsocksNodeConfig => {
  debug('Shadowsocks URI', str);

  const scheme = legacyUrl.parse(str, true);
  const userInfo = fromUrlSafeBase64(scheme.auth as string).split(':');
  const pluginInfo =
    typeof scheme.query.plugin === 'string'
      ? decodeStringList(scheme.query.plugin.split(';'))
      : {};

  return {
    type: NodeTypeEnum.Shadowsocks,
    nodeName: decodeURIComponent((scheme.hash as string).replace('#', '')),
    hostname: scheme.hostname as string,
    port: scheme.port as string,
    method: userInfo[0],
    password: userInfo[1],
    ...(pluginInfo['obfs-local']
      ? {
          obfs: pluginInfo.obfs as 'http' | 'tls',
          'obfs-host': pluginInfo['obfs-host'] as string,
        }
      : null),
    ...(pluginInfo['simple-obfs']
      ? {
          obfs: pluginInfo.obfs as 'http' | 'tls',
          'obfs-host': pluginInfo['obfs-host'] as string,
        }
      : null),
    ...(pluginInfo['v2ray-plugin']
      ? {
          obfs: pluginInfo.tls ? 'wss' : 'ws',
          'obfs-host': pluginInfo.host as string,
        }
      : null),
  };
};
