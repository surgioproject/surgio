import Joi from 'joi';
import { logger } from '@surgio/logger';
import assert from 'assert';

import {
  NodeTypeEnum,
  ShadowsocksNodeConfig,
  V2rayNSubscribeProviderConfig,
  VmessNodeConfig,
} from '../types';
import { fromBase64 } from '../utils';
import { ConfigCache } from '../utils/cache';
import httpClient from '../utils/http-client';
import relayableUrl from '../utils/relayable-url';
import { parseSSUri } from '../utils/ss';
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
      url: Joi.string()
        .uri({
          scheme: [/https?/],
        })
        .required(),
      udpRelay: Joi.bool().strict(),
      tls13: Joi.bool().strict(),
      compatibleMode: Joi.bool().strict(),
      skipCertVerify: Joi.bool().strict(),
    }).unknown();

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
    return relayableUrl(this._url, this.relayUrl);
  }

  public getNodeList(): ReturnType<typeof getV2rayNSubscription> {
    return getV2rayNSubscription(
      this.url,
      this.compatibleMode,
      this.skipCertVerify,
      this.udpRelay,
      this.tls13,
    );
  }
}

/**
 * @see https://github.com/2dust/v2rayN/wiki/%E5%88%86%E4%BA%AB%E9%93%BE%E6%8E%A5%E6%A0%BC%E5%BC%8F%E8%AF%B4%E6%98%8E(ver-2)
 */
export const getV2rayNSubscription = async (
  url: string,
  isCompatibleMode?: boolean | undefined,
  skipCertVerify?: boolean | undefined,
  udpRelay?: boolean | undefined,
  tls13?: boolean | undefined,
): Promise<ReadonlyArray<VmessNodeConfig | ShadowsocksNodeConfig>> => {
  assert(url, '未指定订阅地址 url');

  if (isCompatibleMode) {
    logger.warn('运行在兼容模式，请注意生成的节点是否正确。');
  }

  async function requestConfigFromRemote(): Promise<
    ReadonlyArray<VmessNodeConfig | ShadowsocksNodeConfig>
  > {
    const response = ConfigCache.has(url)
      ? (ConfigCache.get(url) as string)
      : await (async () => {
          const res = await httpClient.get(url);

          ConfigCache.set(url, res.body);

          return res.body;
        })();

    const configList = fromBase64(response)
      .split('\n')
      .filter((item) => !!item)
      .filter((item) => {
        const pick = item.startsWith('vmess://') || item.startsWith('ss://');

        if (!pick) {
          logger.warn(
            `不支持读取 V2rayN 订阅中的节点 ${item}，该节点会被省略。`,
          );
        }

        return pick;
      });

    return configList
      .map((item): VmessNodeConfig | ShadowsocksNodeConfig | undefined => {
        if (item.startsWith('vmess://')) {
          return parseJSONConfig(
            fromBase64(item.replace('vmess://', '')),
            isCompatibleMode,
            skipCertVerify,
            udpRelay,
            tls13,
          );
        }

        if (item.startsWith('ss://')) {
          return {
            ...parseSSUri(item),
            'udp-relay': udpRelay,
            skipCertVerify: skipCertVerify,
            tls13: tls13,
          };
        }

        return undefined;
      })
      .filter(
        (item): item is VmessNodeConfig | ShadowsocksNodeConfig => !!item,
      );
  }

  return await requestConfigFromRemote();
};

export const parseJSONConfig = (
  json: string,
  isCompatibleMode: boolean | undefined,
  skipCertVerify?: boolean | undefined,
  udpRelay?: boolean | undefined,
  tls13?: boolean | undefined,
): VmessNodeConfig | undefined => {
  const config = JSON.parse(json);

  // istanbul ignore next
  if (!isCompatibleMode && (!config.v || Number(config.v) !== 2)) {
    throw new Error(
      `该节点 ${config.ps} 可能不是一个有效的 V2rayN 节点。请参考 https://url.royli.dev/Qtrci 进行排查, 或者将解析模式改为兼容模式`,
    );
  }
  // istanbul ignore next
  if (['kcp', 'http'].indexOf(config.net) > -1) {
    logger.warn(
      `不支持读取 network 类型为 ${config.net} 的 Vmess 节点，节点 ${config.ps} 会被省略。`,
    );
    return undefined;
  }

  return {
    nodeName: config.ps,
    type: NodeTypeEnum.Vmess,
    hostname: config.add,
    port: config.port,
    method: 'auto',
    uuid: config.id,
    alterId: config.aid || '0',
    network: config.net,
    tls: config.tls === 'tls',
    host: config.host,
    path: config.path || '/',
    'udp-relay': udpRelay === true,
    ...(config.tls === 'tls'
      ? {
          skipCertVerify: skipCertVerify ?? false,
          tls13: tls13 ?? false,
        }
      : null),
  };
};
