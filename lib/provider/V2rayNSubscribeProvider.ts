import Joi from '@hapi/joi';
import { logger } from '@surgio/logger';
import assert from "assert";
import got from 'got';

import { NodeTypeEnum, V2rayNSubscribeProviderConfig, VmessNodeConfig } from '../types';
import { fromBase64 } from '../utils';
import { ConfigCache } from '../utils/cache';
import { NETWORK_RETRY, NETWORK_TIMEOUT, RELAY_SERVICE } from '../utils/constant';
import Provider from './Provider';

export default class V2rayNSubscribeProvider extends Provider {
  public readonly compatibleMode?: boolean;
  public readonly skipCertVerify?: boolean;
  public readonly udpRelay?: boolean;
  public readonly tls13?: boolean;

  private readonly _url: string;

  constructor(name: string, config: V2rayNSubscribeProviderConfig) {
    super(name, config);

    const schema = Joi.object({
      url: Joi
        .string()
        .uri({
          scheme: [
            /https?/,
          ],
        })
        .required(),
      udpRelay: Joi.bool().strict(),
      tls13: Joi.bool().strict(),
      compatibleMode: Joi.bool().strict(),
      skipCertVerify: Joi.bool().strict(),
    })
      .unknown();

    const { error } = schema.validate(config);

    // istanbul ignore next
    if (error) {
      throw error;
    }

    this._url = config.url;
    this.compatibleMode = config.compatibleMode;
    this.skipCertVerify = config.skipCertVerify;
    this.tls13 = config.tls13;
    this.udpRelay = config.udpRelay;
  }

  // istanbul ignore next
  public get url(): string {
    if (this.relayUrl) {
      return `${RELAY_SERVICE}${this._url}`;
    }
    return this._url;
  }

  public getNodeList(): ReturnType<typeof getV2rayNSubscription> {
    return getV2rayNSubscription(this.url, this.compatibleMode, this.skipCertVerify, this.udpRelay, this.tls13);
  }
}

/**
 * @see https://github.com/2dust/v2rayN/wiki/%E5%88%86%E4%BA%AB%E9%93%BE%E6%8E%A5%E6%A0%BC%E5%BC%8F%E8%AF%B4%E6%98%8E(ver-2)
 */
export const getV2rayNSubscription = async (
  url: string,
  isCompatibleMode?: boolean|undefined,
  skipCertVerify?: boolean|undefined,
  udpRelay?: boolean|undefined,
  tls13?: boolean|undefined,
): Promise<ReadonlyArray<VmessNodeConfig>> => {
  assert(url, '未指定订阅地址 url');

  if (isCompatibleMode) { logger.warn('运行在兼容模式，请注意生成的节点是否正确。'); }

  async function requestConfigFromRemote(): Promise<ReadonlyArray<VmessNodeConfig>> {
    const response = ConfigCache.has(url) ? ConfigCache.get(url) as string : await (async () => {
      const res = await got.get(url, {
        timeout: NETWORK_TIMEOUT,
        retry: NETWORK_RETRY,
      });

      ConfigCache.set(url, res.body);

      return res.body;
    })();

    const configList = fromBase64(response).split('\n')
      .filter(item => !!item)
      .filter(item => item.startsWith("vmess://"));

    return configList
      .map<VmessNodeConfig|undefined>(item => {
        const json = JSON.parse(fromBase64(item.replace('vmess://', '')));

        // istanbul ignore next
        if (!isCompatibleMode && (!json.v || Number(json.v) !== 2)) {
            throw new Error(`该订阅 ${url} 可能不是一个有效的 V2rayN 订阅。请参考 http://bit.ly/2N4lZ8X 进行排查, 或者将解析模式改为兼容模式`);
        }
        // istanbul ignore next
        if (['kcp', 'http'].indexOf(json.net) > -1) {
          logger.warn(`不支持读取 network 类型为 ${json.net} 的 Vmess 节点，节点 ${json.ps} 会被省略`);
          return undefined;
        }

        return {
          nodeName: json.ps,
          type: NodeTypeEnum.Vmess,
          hostname: json.add,
          port: json.port,
          method: 'auto',
          uuid: json.id,
          alterId: json.aid || '0',
          network: json.net,
          tls: json.tls === 'tls',
          host: json.host || '',
          path: json.path || '/',
          ...(udpRelay ? {
            udp: udpRelay,
          } : null),
          ...(json.tls === 'tls' ? {
            skipCertVerify: skipCertVerify ?? false,
            tls13: tls13 ?? false,
          } : null)
        };
      })
      .filter((item): item is VmessNodeConfig => !!item);
  }

  return await requestConfigFromRemote();
};
