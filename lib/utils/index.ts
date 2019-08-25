import assert from 'assert';
import axios from 'axios';
import flag from 'country-code-emoji';
import fs from "fs";
import _ from 'lodash';
import LRU from 'lru-cache';
import path from 'path';
import queryString from 'query-string';
import URLSafeBase64 from 'urlsafe-base64';
import YAML from 'yaml';
import { JsonObject } from 'type-fest';
import {
  BlackSSLProviderConfig,
  HttpsNodeConfig,
  NodeFilterType,
  NodeNameFilterType,
  NodeTypeEnum, PossibleNodeConfigType,
  ShadowsocksNodeConfig,
  ShadowsocksrNodeConfig,
  SimpleNodeConfig,
  SnellNodeConfig,
  CommandConfig, ProxyGroupModifier, PlainObjectOf,
} from '../types';

const ConfigCache = new LRU<string, any>({
  maxAge: 10 * 60 * 1000, // 10min
});

export const resolveRoot = (...args: readonly string[]): string => path.resolve(__dirname, '../../', ...args);

export const getDownloadUrl = (baseUrl: string = '/', artifactName: string): string => `${baseUrl}${artifactName}`;

export const getBlackSSLConfig = async (config: BlackSSLProviderConfig): Promise<ReadonlyArray<HttpsNodeConfig>> => {
  assert(config.username, 'Lack of BlackSSL username.');
  assert(config.password, 'Lack of BlackSSL password.');

  const key = `blackssl_${config.username}`;

  async function requestConfigFromBlackSSL(username: string, password: string): Promise<ReadonlyArray<HttpsNodeConfig>> {
    const response = await axios
      .get('https://api.darkssl.com/v1/service/ssl_info', {
        params: {
          username,
          password,
        },
        timeout: 20000,
        proxy: false,
        headers: {
          'User-Agent': 'GoAgentX/774 CFNetwork/901.1 Darwin/17.6.0 (x86_64)',
        },
      });

    const result = (response.data.ssl_nodes as readonly any[]).map<HttpsNodeConfig>(item => ({
      nodeName: `${flag(item.country_code as string)}${item.name as string}`,
      type: NodeTypeEnum.HTTPS,
      hostname: item.server as string,
      port: item.port as string,
      username,
      password,
    }));

    ConfigCache.set(key, result);

    return result;
  }

  return ConfigCache.has(key) ?
    ConfigCache.get(key) :
    await requestConfigFromBlackSSL(config.username, config.password);
};

export const getShadowsocksJSONConfig = async (config: {
  readonly url: string,
  readonly udpRelay?: boolean,
}): Promise<ReadonlyArray<ShadowsocksNodeConfig>> => {
  assert(config.url, 'Lack of subscription url.');

  async function requestConfigFromRemote(url: string): Promise<ReadonlyArray<ShadowsocksNodeConfig>> {
    const response = await axios.get(url, {
      proxy: false,
      timeout: 20000,
    });

    const result = (response.data.configs as readonly any[]).map<ShadowsocksNodeConfig>(item => {
      const nodeConfig: any = {
        nodeName: item.remarks as string,
        type: NodeTypeEnum.Shadowsocks,
        hostname: item.server as string,
        port: item.server_port as string,
        method: item.method as string,
        password: item.password as string,
      };

      if (typeof config.udpRelay === 'boolean') {
        nodeConfig['udp-relay'] = config.udpRelay ? 'true' : 'false';
      }
      if (item.plugin === 'obfs-local') {
        const obfs = item.plugin_opts.match(/obfs=(\w+)/);
        const obfsHost = item.plugin_opts.match(/obfs-host=(.+)$/);

        if (obfs) {
          nodeConfig.obfs = obfs[1];
          nodeConfig['obfs-host'] = obfsHost ? obfsHost[1] : 'www.bing.com';
        }
      }

      return nodeConfig;
    });

    ConfigCache.set(url, result);

    return result;
  }

  return ConfigCache.has(config.url) ?
    ConfigCache.get(config.url) :
    await requestConfigFromRemote(config.url);
};

// eslint-disable-next-line no-unused-vars
export const getSurgeNodes = (
  list: ReadonlyArray<HttpsNodeConfig | ShadowsocksNodeConfig | SnellNodeConfig>,
  filter?: NodeFilterType,
): string => {
  const result: string[] = list
    .filter(item => filter ? filter(item) : true)
    .map<string>(nodeConfig => {
      if (nodeConfig.enable === false) { return null; }

      switch (nodeConfig.type) {
        case NodeTypeEnum.Shadowsocks: {
          const config = nodeConfig as ShadowsocksNodeConfig;

          return ([
            config.nodeName,
            [
              'custom',
              config.hostname,
              config.port,
              config.method,
              config.password,
              'https://raw.githubusercontent.com/ConnersHua/SSEncrypt/master/SSEncrypt.module',
              ...pickAndFormatStringList(config, ['udp-relay', 'obfs', 'obfs-host']),
            ].join(', ')
          ].join(' = '));
        }

        case NodeTypeEnum.HTTPS: {
          const config = nodeConfig as HttpsNodeConfig;

          return ([
            config.nodeName,
            [
              'https',
              config.hostname,
              config.port,
              config.username,
              config.password,
            ].join(', ')
          ].join(' = '));
        }

        case NodeTypeEnum.Snell: {
          const config = nodeConfig as SnellNodeConfig;

          return ([
            config.nodeName,
            [
              'snell',
              config.hostname,
              config.port,
              ...pickAndFormatStringList(config, ['psk', 'obfs']),
            ].join(', ')
          ].join(' = '));
        }

        default:
          return null;
      }
    })
    .filter(item => item !== null);

  return result.join('\n');
};

export const getClashNodes = (
  list: ReadonlyArray<PossibleNodeConfigType>,
  filter?: NodeFilterType
): ReadonlyArray<any> => {
  return list
    .filter(item => filter ? filter(item) : true)
    .map(nodeConfig => {
      if (nodeConfig.enable === false) { return null; }

      switch (nodeConfig.type) {
        case NodeTypeEnum.Shadowsocks:
          return {
            cipher: nodeConfig.method,
            name: nodeConfig.nodeName,
            password: nodeConfig.password,
            port: nodeConfig.port,
            server: nodeConfig.hostname,
            type: 'ss',
            udp: nodeConfig['udp-relay'] === 'true',
            ...(nodeConfig.obfs ? {
              plugin: 'obfs',
              'plugin-opts': {
                mode: nodeConfig.obfs,
                host: nodeConfig['obfs-host'],
              },
            } : {}),
          };

        default:
          console.info(`${nodeConfig.type} is not supported yet, ${nodeConfig.nodeName} will be ignored.`);
          return null;
      }
    })
    .filter(item => item !== null);
};

export const toUrlSafeBase64 = (str: string): string => URLSafeBase64.encode(Buffer.from(str, 'utf8'));

export const toBase64 = (str: string): string => Buffer.from(str, 'utf8').toString('base64');

/**
 * @see https://github.com/shadowsocks/shadowsocks-org/wiki/SIP002-URI-Scheme
 */
export const getShadowsocksNodes = (
  list: ReadonlyArray<ShadowsocksNodeConfig>,
  groupName: string
): string => {
  const result: ReadonlyArray<any> = list
    .map(nodeConfig => {
      if (nodeConfig.enable === false) { return null; }

      switch (nodeConfig.type) {
        case NodeTypeEnum.Shadowsocks: {
          const config = _.cloneDeep(nodeConfig);
          const query: {
            readonly plugin?: string;
            readonly group?: string;
          } = {
            ...(config.obfs ? {
              plugin: `${encodeURIComponent(`obfs-local;obfs=${config.obfs};obfs-host=${config['obfs-host']}`)}`,
            } : {}),
            ...(groupName ? { group: encodeURIComponent(groupName) } : {}),
          };

          return [
            'ss://',
            toUrlSafeBase64(`${config.method}:${config.password}`),
            '@',
            config.hostname,
            ':',
            config.port,
            '/?',
            queryString.stringify(query, {
              encode: false,
              sort: false,
            }),
            '#',
            encodeURIComponent(config.nodeName),
          ].join('');
        }

        default:
          return null;
      }
    })
    .filter(item => item !== null);

  return result.join('\n');
};

export const getShadowsocksrNodes = (list: ReadonlyArray<ShadowsocksrNodeConfig>): string => {
  const result: ReadonlyArray<string> = list
    .map(nodeConfig => {
      if (nodeConfig.enable === false) { return null; }

      switch (nodeConfig.type) {
        case NodeTypeEnum.Shadowsocksr: {
          const baseUri = [
            nodeConfig.hostname,
            nodeConfig.port,
            nodeConfig.protocol,
            nodeConfig.method,
            nodeConfig.obfs,
            toUrlSafeBase64(nodeConfig.password),
          ].join(':');
          const query = {
            obfsparam: toUrlSafeBase64(nodeConfig.obfsparam),
            protoparam: toUrlSafeBase64(nodeConfig.protoparam),
            remarks: toUrlSafeBase64(nodeConfig.nodeName),
            group: toUrlSafeBase64(nodeConfig.group),
            udpport: 0,
            uot: 0,
          };

          return 'ssr://' + toUrlSafeBase64([
            baseUri,
            '/?',
            queryString.stringify(query),
          ].join(''));
        }

        default:
          return null;
      }
    })
    .filter(item => item !== null);

  return result.join('\n');
};

export const getShadowsocksNodesJSON = (list: ReadonlyArray<ShadowsocksNodeConfig>): string => {
  const nodes: ReadonlyArray<object> = list
    .map(nodeConfig => {
      if (nodeConfig.enable === false) { return null; }

      switch (nodeConfig.type) {
        case NodeTypeEnum.Shadowsocks: {
          const useObfs: boolean = Boolean(nodeConfig.obfs && nodeConfig['obfs-host']);
          return {
            remarks: nodeConfig.nodeName,
            server: nodeConfig.hostname,
            server_port: nodeConfig.port,
            method: nodeConfig.method,
            remarks_base64: toUrlSafeBase64(nodeConfig.nodeName),
            password: nodeConfig.password,
            tcp_over_udp: false,
            udp_over_tcp: false,
            enable: true,
            ...(useObfs ? {
              plugin: 'obfs-local',
              'plugin-opts': `obfs=${nodeConfig.obfs};obfs-host=${nodeConfig['obfs-host']}`
            } : {})
          };
        }

        default:
          return null;
      }
    })
    .filter(item => item !== null);

  return JSON.stringify(nodes, null, 2);
};

export const getNodeNames = (
  list: ReadonlyArray<SimpleNodeConfig>,
  nodeTypeList: readonly NodeTypeEnum[] = [NodeTypeEnum.Shadowsocks, NodeTypeEnum.HTTPS, NodeTypeEnum.Snell],
  filter?: NodeNameFilterType
): string => {
  const nodes = list.filter(item => {
    const result = nodeTypeList.includes(item.type) && item.enable !== false;

    if (filter) {
      return filter(item) && result;
    }

    return result;
  });

  return nodes.map(item => item.nodeName).join(', ');
};

export const getClashNodeNames = (
  ruleName: string,
  ruleType: 'select' | 'url-test',
  nodeNameList: ReadonlyArray<SimpleNodeConfig>,
  nodeTypeList: ReadonlyArray<NodeTypeEnum> = [NodeTypeEnum.Shadowsocks],
  filter?: NodeNameFilterType
): {
  readonly type: string;
  readonly name: string;
  readonly proxies: readonly string[];
  readonly url?: string;
  readonly interval?: number;
} => {
  const nodes = nodeNameList.filter(item => {
    const result = nodeTypeList.includes(item.type) && item.enable !== false;

    if (filter) {
      return filter(item) && result;
    }

    return result;
  });

  return {
    type: ruleType,
    name: ruleName,
    proxies: nodes.map(item => item.nodeName),
    ...(ruleType === 'url-test' ? {
      url: 'http://www.gstatic.com/generate_204',
      interval: 1200,
    } : {}),
  };
};

export const toYaml = (obj: JsonObject): string => YAML.stringify(obj);

export const netflixFilter: NodeNameFilterType = item => {
  const name = item.nodeName.toLowerCase();
  return [
    'netflix',
    'hkbn',
    'hkt',
    'hgc',
  ].some(key => name.toLowerCase().includes(key.toLowerCase()));
};

export const youtubePremiumFilter: NodeNameFilterType = item => {
  const name = item.nodeName.toLowerCase();
  return ['日', '美', '韩', '🇯🇵', '🇺🇸', '🇰🇷'].some(key => name.toLowerCase().includes(key.toLowerCase()));
};

export const usFilter: NodeNameFilterType = item => {
  return ['🇺🇸', '美'].some(key => item.nodeName.includes(key));
};

export const hkFilter: NodeNameFilterType = item => {
  return ['🇭🇰', '港'].some(key => item.nodeName.includes(key));
};

export const pickAndFormatStringList = (obj: object, keyList: readonly string[]): readonly string[] => {
  const result: string[] = [];
  keyList.forEach(key => {
    if (obj.hasOwnProperty(key)) {
      result.push(`${key}=${obj[key]}`);
    }
  });
  return result;
};

export const normalizeConfig = (cwd: string, obj: Partial<CommandConfig>): CommandConfig => {
  const config = _.defaults<Partial<CommandConfig>, CommandConfig>(obj, {
    artifacts: [],
    urlBase: '/',
    output: path.resolve(cwd, './dist'),
    templateDir: path.resolve(cwd, './template'),
    providerDir: path.resolve(cwd, './provider'),
    upload: {
      region: 'oss-cn-hangzhou',
      prefix: '/',
    },
  });

  if (!fs.existsSync(config.templateDir)) {
    throw new Error(`You must create ${config.templateDir} first.`);
  }
  if (!fs.existsSync(config.providerDir)) {
    throw new Error(`You must create ${config.providerDir} first.`);
  }

  return config;
};

export const loadConfig = (cwd: string, configPath: string, override?: Partial<CommandConfig>): CommandConfig => {
  const absPath = path.resolve(cwd, configPath);

  if (!fs.existsSync(absPath)) {
    throw new Error(`${absPath} cannot be found.`);
  }

  if (override) {
    return {
      ...normalizeConfig(cwd, require(absPath)),
      ...override,
    };
  }

  return normalizeConfig(cwd, require(absPath));
};

export const normalizeClashProxyGroupConfig = (
  nodeList: ReadonlyArray<PossibleNodeConfigType>,
  customFilters: PlainObjectOf<NodeNameFilterType>,
  proxyGroupModifier: ProxyGroupModifier
): ReadonlyArray<any> => {
  const proxyGroup = proxyGroupModifier(nodeList, customFilters);

  return proxyGroup.map<any>(item => {
    if (item.filter) {
      return getClashNodeNames(item.name, item.type, nodeList, [NodeTypeEnum.Shadowsocks], item.filter);
    } else if (item.proxies) {
      return item;
    } else {
      return getClashNodeNames(item.name, item.type, nodeList, [NodeTypeEnum.Shadowsocks]);
    }
  });
};
