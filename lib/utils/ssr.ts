import queryString from 'query-string';
import { NodeTypeEnum, ShadowsocksrNodeConfig } from '../types';
import { fromUrlSafeBase64 } from './index';

/**
 * 协议：https://github.com/shadowsocksr-backup/shadowsocks-rss/wiki/SSR-QRcode-scheme
 * ssr://xxx:xxx:xxx:xxx:xxx:xxx/?a=1&b=2
 * ssr://xxx:xxx:xxx:xxx:xxx:xxx
 */
export const parseSSRUri = (str: string): ShadowsocksrNodeConfig => {
  const scheme = fromUrlSafeBase64(str.replace('ssr://', ''));
  const configArray = scheme.split('/');
  const basicInfo = configArray[0].split(':');

  // 去除首部分
  configArray.shift();

  const extraString = configArray.join('/');
  const extras = extraString ? getUrlParameters(extraString) : {};
  const nodeName = extras.remarks ?
    fromUrlSafeBase64(extras.remarks) :
    `${basicInfo[0]}:${basicInfo[1]}`;

  return {
    type: NodeTypeEnum.Shadowsocksr,
    nodeName,
    hostname: basicInfo[0],
    port: basicInfo[1],
    protocol: basicInfo[2],
    method: basicInfo[3],
    obfs: basicInfo[4],
    password: fromUrlSafeBase64(basicInfo[5]),
    protoparam: fromUrlSafeBase64(extras.protoparam || '').replace(/\s/g, ''),
    obfsparam: fromUrlSafeBase64(extras.obfsparam || '').replace(/\s/g, ''),
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
