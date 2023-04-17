import { z } from 'zod';

import {
  CustomProviderConfig,
  NodeTypeEnum,
  PossibleNodeConfigType,
} from '../types';
import { assertNever } from '../utils';
import Provider from './Provider';
import {
  WireguardNodeConfigValidator,
  ShadowsocksNodeConfigValidator,
  HttpNodeConfigValidator,
  HttpsNodeConfigValidator,
  TrojanNodeConfigValidator,
  ShadowsocksrNodeConfigValidator,
  Socks5NodeConfigValidator,
  VmessNodeConfigValidator,
  SnellNodeConfigValidator,
  TuicNodeConfigValidator,
} from '../validators';

export default class CustomProvider extends Provider {
  public readonly nodeList: ReadonlyArray<PossibleNodeConfigType>;
  public readonly underlyingProxy?: string;

  constructor(name: string, config: CustomProviderConfig) {
    super(name, config);

    const schema = z.object({
      nodeList: z.array(z.unknown()),
      underlyingProxy: z.ostring(),
    });
    const result = schema.safeParse(config);
    const nodeList: PossibleNodeConfigType[] = [];

    // istanbul ignore next
    if (!result.success) {
      throw result.error;
    }

    for (const node of result.data.nodeList) {
      if (typeof node !== 'object' || node === null || !('type' in node)) {
        throw new Error('Invalid node type');
      }

      const type = node.type as NodeTypeEnum;

      switch (type) {
        case NodeTypeEnum.Shadowsocks:
          nodeList.push(ShadowsocksNodeConfigValidator.parse(node));
          break;

        case NodeTypeEnum.Shadowsocksr:
          nodeList.push(ShadowsocksrNodeConfigValidator.parse(node));
          break;

        case NodeTypeEnum.Vmess:
          nodeList.push(VmessNodeConfigValidator.parse(node));
          break;

        case NodeTypeEnum.Trojan:
          nodeList.push(TrojanNodeConfigValidator.parse(node));
          break;

        case NodeTypeEnum.Socks5:
          nodeList.push(Socks5NodeConfigValidator.parse(node));
          break;

        case NodeTypeEnum.HTTP:
          nodeList.push(HttpNodeConfigValidator.parse(node));
          break;

        case NodeTypeEnum.HTTPS:
          nodeList.push(HttpsNodeConfigValidator.parse(node));
          break;

        case NodeTypeEnum.Snell:
          nodeList.push(SnellNodeConfigValidator.parse(node));
          break;

        case NodeTypeEnum.Tuic:
          nodeList.push(TuicNodeConfigValidator.parse(node));
          break;

        case NodeTypeEnum.Wireguard:
          nodeList.push(WireguardNodeConfigValidator.parse(node));
          break;

        default:
          assertNever(type);
      }
    }

    this.nodeList = nodeList;
    this.underlyingProxy = result.data.underlyingProxy;
  }

  public async getNodeList(): Promise<ReadonlyArray<PossibleNodeConfigType>> {
    return this.nodeList.map((item) => {
      const propertyKeysMustBeLowercase = ['wsHeaders'];

      if (this.underlyingProxy && !item.underlyingProxy) {
        item.underlyingProxy = this.underlyingProxy;
      }

      // istanbul ignore next
      if (item['udp-relay']) {
        throw new Error('udp-relay is abandoned, please use udpRelay instead');
      }

      // istanbul ignore next
      if (item['obfs-host']) {
        throw new Error('obfs-host is abandoned, please use obfsHost instead');
      }

      // istanbul ignore next
      if (item['udp-relay']) {
        throw new Error('obfs-uri is abandoned, please use obfsUri instead');
      }

      propertyKeysMustBeLowercase.forEach((key) => {
        if (item[key]) {
          item[key] = Object.keys(item[key]).reduce((acc, curr) => {
            acc[curr.toLowerCase()] = item[key][curr];
            return acc;
          }, {});
        }
      });

      return item;
    });
  }
}
