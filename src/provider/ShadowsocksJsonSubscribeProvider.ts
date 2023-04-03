import assert from 'assert';
import Joi from 'joi';
import {
  NodeTypeEnum,
  ShadowsocksJsonSubscribeProviderConfig,
  ShadowsocksNodeConfig,
} from '../types';
import relayableUrl from '../utils/relayable-url';
import Provider from './Provider';

export default class ShadowsocksJsonSubscribeProvider extends Provider {
  public readonly udpRelay?: boolean;
  private readonly _url: string;

  constructor(name: string, config: ShadowsocksJsonSubscribeProviderConfig) {
    super(name, config);

    const schema = Joi.object({
      url: Joi.string()
        .uri({
          scheme: [/https?/],
        })
        .required(),
      udpRelay: Joi.boolean().strict(),
    }).unknown();

    const { error } = schema.validate(config);

    // istanbul ignore next
    if (error) {
      throw error;
    }

    this._url = config.url;
    this.udpRelay = config.udpRelay;
  }

  // istanbul ignore next
  public get url(): string {
    return relayableUrl(this._url, this.relayUrl);
  }

  public getNodeList({
    requestUserAgent,
  }: { requestUserAgent?: string } = {}): ReturnType<
    typeof getShadowsocksJSONConfig
  > {
    return getShadowsocksJSONConfig(
      this.url,
      this.udpRelay,
      requestUserAgent || this.requestUserAgent,
    );
  }
}

export const getShadowsocksJSONConfig = async (
  url: string,
  udpRelay?: boolean,
  requestUserAgent?: string,
): Promise<ReadonlyArray<ShadowsocksNodeConfig>> => {
  assert(url, '未指定订阅地址 url');

  async function requestConfigFromRemote(): Promise<
    ReadonlyArray<ShadowsocksNodeConfig>
  > {
    const response = await Provider.requestCacheableResource(url, {
      requestUserAgent: requestUserAgent || 'shadowrocket',
    });
    const config = JSON.parse(response.body) as {
      configs?: ReadonlyArray<any>;
    };

    if (!config || !config.configs) {
      throw new Error('订阅地址返回的数据格式不正确');
    }

    return config.configs.map((item): ShadowsocksNodeConfig => {
      const nodeConfig: any = {
        nodeName: item.remarks as string,
        type: NodeTypeEnum.Shadowsocks,
        hostname: item.server as string,
        port: item.server_port as string,
        method: item.method as string,
        password: item.password as string,
      };

      if (typeof udpRelay === 'boolean') {
        nodeConfig.udpRelay = udpRelay;
      }
      if (item.plugin === 'obfs-local') {
        const obfs = item.plugin_opts.match(/obfs=(\w+)/);
        const obfsHost = item.plugin_opts.match(/obfs-host=(.+)$/);

        if (obfs) {
          nodeConfig.obfs = obfs[1];
          nodeConfig.obfsHost = obfsHost ? obfsHost[1] : 'www.bing.com';
        }
      }

      return nodeConfig;
    });
  }

  return await requestConfigFromRemote();
};
