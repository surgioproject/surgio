import Joi from '@hapi/joi';
import assert from 'assert';
import axios from 'axios';
import chalk from 'chalk';
import yaml from 'yaml';
import _ from 'lodash';

import {
  ClashProviderConfig,
  HttpsNodeConfig,
  NodeTypeEnum,
  ShadowsocksNodeConfig,
  ShadowsocksrNodeConfig,
  SnellNodeConfig,
  VmessNodeConfig,
} from '../types';
import { ConfigCache } from '../utils';
import { NETWORK_TIMEOUT } from '../utils/constant';
import Provider from './Provider';

type SupportConfigTypes = ShadowsocksNodeConfig|VmessNodeConfig|HttpsNodeConfig|ShadowsocksrNodeConfig|SnellNodeConfig;

export default class ClashProvider extends Provider {
  public static async getClashSubscription(url: string): Promise<ReadonlyArray<SupportConfigTypes>> {
    assert(url, '未指定订阅地址 url');

    return ConfigCache.has(url) ?
      ConfigCache.get(url) :
      await requestConfigFromRemote(url);
  }

  public readonly url: string;

  constructor(config: ClashProviderConfig) {
    super(config);

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

    if (error) {
      throw error;
    }

    this.url = config.url;
  }

  public getNodeList(): ReturnType<typeof ClashProvider.getClashSubscription> {
    return ClashProvider.getClashSubscription(this.url);
  }
}

async function requestConfigFromRemote(url): Promise<ReadonlyArray<SupportConfigTypes>> {
  const response = await axios.get(url, {
    timeout: NETWORK_TIMEOUT,
    responseType: 'text',
  });
  const clashConfig = yaml.parse(response.data);
  const proxyList: any[] = clashConfig.Proxy;
  const result = proxyList.map<SupportConfigTypes>(item => {
    switch (item.type) {
      case 'ss':
        if (item.plugin && item.plugin !== 'obfs') {
          console.log();
          console.log(`不支持读取 ${item.plugin} 类型的 Clash 节点，节点 ${item.name} 会被省略`);
          return null;
        }

        return {
          type: NodeTypeEnum.Shadowsocks,
          nodeName: item.name,
          hostname: item.server,
          port: item.port,
          method: item.cipher,
          password: item.password,
          'udp-relay': item.udp ? 'true' : 'false',
          ...(item.plugin && item.plugin === 'obfs' ? {
            obfs: item['plugin-opts'].mode,
            'obfs-host': item['plugin-opts'].host || 'www.bing.com',
          } : null),
        };

      case 'vmess':
        return {
          type: NodeTypeEnum.Vmess,
          nodeName: item.name,
          hostname: item.server,
          port: item.port,
          uuid: item.uuid,
          alterId: item.alterId ? `${item.alterId}` : '0',
          method: item.cipher || 'auto',
          udp: item.udp !== void 0 ? item.udp : false,
          tls: item.tls !== void 0 ? item.tls : false,
          network: item.network || 'tcp',
          ...(item.network === 'ws' ? {
            path: _.get(item, 'ws-path', '/'),
            host: _.get(item, 'ws-headers.Host', ''),
          } : null),
        };

      case 'http':
        if (item.tls !== 'https') {
          console.log();
          console.log(`不支持读取 HTTP 类型的 Clash 节点，节点 ${item.name} 会被省略`);
          return null;
        }

        return {
          type: NodeTypeEnum.HTTPS,
          nodeName: item.name,
          hostname: item.server,
          port: item.port,
          username: item.username || '',
          password: item.password || '',
        };

      case 'snell':
        return {
          type: NodeTypeEnum.Snell,
          nodeName: item.name,
          hostname: item.server,
          port: item.port,
          psk: item.psk,
          obfs: _.get(item, 'obfs-opts.mode', 'http'),
        };

      case 'ssr':
        return {
          type: NodeTypeEnum.Shadowsocksr,
          nodeName: item.name,
          hostname: item.server,
          port: item.port,
          password: item.password,
          obfs: item.obfs,
          obfsparam: item.obfsparam,
          protocol: item.protocol,
          protoparam: item.protocolparam,
          method: item.cipher,
        };

      default:
        console.log();
        console.log(chalk.yellow(`不支持读取 ${item.type} 的节点，节点 ${item.name} 会被省略`));
        return null;
    }
  })
    .filter(item => !!item);

  ConfigCache.set(url, result);

  return result;
}
