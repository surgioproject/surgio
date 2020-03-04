import Joi from '@hapi/joi';
import { logger } from '@surgio/logger';
import assert from "assert";
import got from 'got';

import { NodeTypeEnum, V2rayNSubscribeProviderConfig, VmessNodeConfig } from '../types';
import { fromBase64 } from '../utils';
import { ConfigCache } from '../utils/cache';
import { NETWORK_TIMEOUT } from '../utils/constant';
import Provider from './Provider';

export default class V2rayNSubscribeProvider extends Provider {
  public readonly url: string;

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
    })
      .unknown();

    const { error } = schema.validate(config);

    // istanbul ignore next
    if (error) {
      throw error;
    }

    this.url = config.url;
  }

  public getNodeList(): ReturnType<typeof getV2rayNSubscription> {
    return getV2rayNSubscription(this.url);
  }
}

export const getV2rayNSubscription = async (
  url: string,
): Promise<ReadonlyArray<VmessNodeConfig>> => {
  assert(url, '未指定订阅地址 url');

  async function requestConfigFromRemote(): Promise<ReadonlyArray<VmessNodeConfig>> {
    const response = ConfigCache.has(url) ? ConfigCache.get(url) : await (async () => {
      const res = await got.get(url, {
        timeout: NETWORK_TIMEOUT,
      });

      ConfigCache.set(url, res.body);

      return res.body;
    })();

    const configList = fromBase64(response).split('\n')
      .filter(item => !!item)
      .filter(item => item.startsWith("vmess://"));

    return configList.map<VmessNodeConfig>(item => {
      const json = JSON.parse(fromBase64(item.replace('vmess://', '')));

      // istanbul ignore next
      if (!json.v || Number(json.v) !== 2) {
        throw new Error(`该订阅 ${url} 可能不是一个有效的 V2rayN 订阅。请参考 http://bit.ly/2N4lZ8X 进行排查`);
      }

      // istanbul ignore next
      if (['kcp', 'http'].indexOf(json.net) > -1) {
        logger.warn(`不支持读取 network 类型为 ${json.net} 的 Vmess 节点，节点 ${json.ps} 会被省略`);
        return null;
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
      };
    })
      .filter(item => !!item);
  }

  return await requestConfigFromRemote();
};
