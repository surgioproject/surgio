import Debug from 'debug';
import { URL } from 'url';

import { NodeTypeEnum, TrojanNodeConfig } from '../types';

const debug = Debug('surgio:utils:trojan');

export const parseTrojanUri = (str: string): TrojanNodeConfig => {
  debug('Trojan URI', str);

  const scheme = new URL(str);

  if (scheme.protocol !== 'trojan:') {
    throw new Error('Invalid Trojan URI.');
  }

  const allowInsecure =
    scheme.searchParams.get('allowInsecure') === '1' ||
    scheme.searchParams.get('allowInsecure') === 'true';
  const sni = scheme.searchParams.get('sni') || scheme.searchParams.get('peer');

  return {
    type: NodeTypeEnum.Trojan,
    hostname: scheme.hostname,
    port: scheme.port,
    password: scheme.username,
    nodeName: scheme.hash
      ? decodeURIComponent(scheme.hash.slice(1))
      : `${scheme.hostname}:${scheme.port}`,
    ...(allowInsecure
      ? {
          skipCertVerify: true,
        }
      : null),
    ...(sni
      ? {
          sni,
        }
      : null),
  };
};
