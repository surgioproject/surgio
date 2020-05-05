import { NodeTypeEnum, ShadowsocksrNodeConfig } from '../types';
import { fromUrlSafeBase64 } from './index';
import Debug from 'debug';

const debug = Debug('surgio:utils:ssr');

/**
 * 协议：https://github.com/shadowsocksr-backup/shadowsocks-rss/wiki/SSR-QRcode-scheme
 * ssr://xxx:xxx:xxx:xxx:xxx:xxx/?a=1&b=2
 * ssr://xxx:xxx:xxx:xxx:xxx:xxx
 */
export const parseSSRUri = (str: string): ShadowsocksrNodeConfig => {
  const scheme = fromUrlSafeBase64(str.replace('ssr://', ''));
  const configArray = scheme.split('/');
  const basicInfo = configArray[0].split(':');
  debug('SSR URI', scheme);

  // 去除首部分
  configArray.shift();

  const extraString = configArray.join('/');
  const extras = extraString ? getUrlParameters(extraString) : {};
  const password = fromUrlSafeBase64(basicInfo.pop() as string);
  const obfs = basicInfo.pop() as string;
  const method = basicInfo.pop() as string;
  const protocol = basicInfo.pop() as string;
  const port = basicInfo.pop() as string;
  const hostname = basicInfo.join(':');
  const nodeName = extras.remarks ?
    fromUrlSafeBase64(extras.remarks) :
    `${hostname}:${port}`;

  return {
    type: NodeTypeEnum.Shadowsocksr,
    nodeName,
    hostname,
    port,
    protocol,
    method,
    obfs,
    password,
    protoparam: fromUrlSafeBase64(extras.protoparam ?? '').replace(/\s/g, ''),
    obfsparam: fromUrlSafeBase64(extras.obfsparam ?? '').replace(/\s/g, ''),
  };
};

function getUrlParameters(url: string): Record<string, string> {
  const result: Record<string, string> = {};
  url.replace(/[?&]+([^=&]+)=([^&#]*)/gi, (origin, k, v) => {
    result[k] = v;
    return origin;
  });
  return result;
}
