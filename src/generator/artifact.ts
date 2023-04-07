import { logger } from '@surgio/logger';
import assert from 'assert';
import Bluebird from 'bluebird';
import fs from 'fs-extra';
import _ from 'lodash';
import { Environment } from 'nunjucks';
import path from 'path';
import { EventEmitter } from 'events';

import { getProvider } from '../provider';
import {
  ArtifactConfig,
  CommandConfig,
  NodeTypeEnum,
  PossibleNodeConfigType,
  ProviderConfig,
  RemoteSnippet,
  SimpleNodeConfig,
} from '../types';
import {
  getClashNodeNames,
  getClashNodes,
  getDownloadUrl,
  getMellowNodes,
  getNodeNames,
  getQuantumultXNodes,
  getShadowsocksNodes,
  getShadowsocksNodesJSON,
  getShadowsocksrNodes,
  getSurgeNodes,
  getSurfboardNodes,
  getUrl,
  getV2rayNNodes,
  isIp,
  toBase64,
  toUrlSafeBase64,
  getSurgeWireguardNodes,
} from '../utils';
import { resolveDomain } from '../utils/dns';
import { getNetworkConcurrency } from '../utils/env-flag';
import {
  hkFilter,
  japanFilter,
  koreaFilter,
  netflixFilter as defaultNetflixFilter,
  singaporeFilter,
  taiwanFilter,
  usFilter,
  chinaBackFilter,
  chinaOutFilter,
  validateFilter,
  youtubePremiumFilter as defaultYoutubePremiumFilter,
  shadowsocksFilter,
  shadowsocksrFilter,
  vmessFilter,
  v2rayFilter,
  snellFilter,
  httpFilter,
  httpsFilter,
  trojanFilter,
  socks5Filter,
} from '../utils/filter';
import { prependFlag, removeFlag } from '../utils/flag';
import { getLoonNodes } from '../utils/loon';
import { loadLocalSnippet } from './template';

type ThenArg<T> = T extends PromiseLike<infer U> ? U : T;

export interface ArtifactOptions {
  readonly remoteSnippetList?: ReadonlyArray<RemoteSnippet>;
  readonly templateEngine?: Environment;
}

export interface ExtendableRenderContext {
  readonly urlParams?: Record<string, string>;
}

export class Artifact extends EventEmitter {
  public initProgress = 0;

  public providerNameList: ReadonlyArray<string>;
  public nodeConfigListMap: Map<string, ReadonlyArray<PossibleNodeConfigType>> =
    new Map();
  public providerMap: Map<string, ThenArg<ReturnType<typeof getProvider>>> =
    new Map();
  public nodeList: PossibleNodeConfigType[] = [];
  public nodeNameList: SimpleNodeConfig[] = [];

  private customFilters: NonNullable<ProviderConfig['customFilters']>;
  private netflixFilter: NonNullable<ProviderConfig['netflixFilter']>;
  private youtubePremiumFilter: NonNullable<
    ProviderConfig['youtubePremiumFilter']
  >;

  constructor(
    public surgioConfig: CommandConfig,
    public artifact: ArtifactConfig,
    private options: ArtifactOptions = {},
  ) {
    super();

    const { name: artifactName, template, templateString } = artifact;

    assert(artifactName, '必须指定 artifact 的 name 属性');
    assert(artifact.provider, '必须指定 artifact 的 provider 属性');
    if (!templateString) {
      assert(template, '必须指定 artifact 的 template 属性');
    }

    const mainProviderName = artifact.provider;
    const combineProviders = artifact.combineProviders || [];

    this.providerNameList = [mainProviderName].concat(combineProviders);
  }

  public get isReady(): boolean {
    return this.initProgress === this.providerNameList.length;
  }

  public getRenderContext(extendRenderContext: ExtendableRenderContext = {}) {
    const config = this.surgioConfig;
    const gatewayConfig = config.gateway;
    const gatewayToken =
      gatewayConfig?.viewerToken || gatewayConfig?.accessToken;
    const { name: artifactName, customParams, downloadUrl } = this.artifact;

    const {
      nodeList,
      nodeNameList,
      netflixFilter,
      youtubePremiumFilter,
      customFilters,
    } = this;
    const remoteSnippets = _.keyBy(
      this.options.remoteSnippetList || [],
      (item) => item.name,
    );
    const globalCustomParams = config.customParams;
    const mergedCustomParams = _.merge(
      {},
      globalCustomParams,
      customParams,
      extendRenderContext?.urlParams,
    );

    return {
      proxyTestUrl: config.proxyTestUrl,
      downloadUrl: downloadUrl
        ? downloadUrl
        : getDownloadUrl(config.urlBase, artifactName, true, gatewayToken),
      snippet: (filePath: string): RemoteSnippet => {
        return loadLocalSnippet(config.templateDir, filePath);
      },
      nodes: nodeList,
      names: nodeNameList,
      remoteSnippets,
      nodeList,
      provider: this.artifact.provider,
      providerName: this.artifact.provider,
      artifactName,
      getDownloadUrl: (name: string) =>
        getDownloadUrl(config.urlBase, name, true, gatewayToken),
      getUrl: (p: string) => getUrl(config.publicUrl, p, gatewayToken),
      getNodeNames,
      getClashNodeNames,
      getClashNodes,
      getSurgeNodes,
      getSurgeWireguardNodes,
      getSurfboardNodes,
      getShadowsocksNodes,
      getShadowsocksNodesJSON,
      getShadowsocksrNodes,
      getV2rayNNodes,
      getQuantumultXNodes,
      getMellowNodes,
      getLoonNodes,
      usFilter,
      hkFilter,
      japanFilter,
      koreaFilter,
      singaporeFilter,
      taiwanFilter,
      chinaBackFilter,
      chinaOutFilter,
      shadowsocksFilter,
      shadowsocksrFilter,
      vmessFilter,
      v2rayFilter,
      snellFilter,
      httpFilter,
      httpsFilter,
      trojanFilter,
      socks5Filter,
      toUrlSafeBase64,
      toBase64,
      encodeURIComponent,
      netflixFilter,
      youtubePremiumFilter,
      customFilters,
      customParams: mergedCustomParams,
    };
  }

  public async init({
    requestUserAgent,
  }: { requestUserAgent?: string } = {}): Promise<this> {
    if (this.isReady) {
      throw new Error('Artifact 已经初始化完成');
    }

    this.emit('initArtifact:start', { artifact: this.artifact });

    await Bluebird.map(
      this.providerNameList,
      async (providerName) => {
        await this.providerMapper(providerName, { requestUserAgent });
      },
      {
        concurrency: getNetworkConcurrency(),
      },
    );

    this.providerNameList.forEach((providerName) => {
      const nodeConfigList = this.nodeConfigListMap.get(providerName);

      if (nodeConfigList) {
        nodeConfigList.forEach((nodeConfig) => {
          if (nodeConfig) {
            this.nodeNameList.push({
              type: nodeConfig.type,
              enable: nodeConfig.enable,
              nodeName: nodeConfig.nodeName,
              provider: nodeConfig.provider,
            });
            this.nodeList.push(nodeConfig);
          }
        });
      }
    });

    this.emit('initArtifact:end', { artifact: this.artifact });

    return this;
  }

  public render(
    templateEngine?: Environment,
    extendRenderContext?: ExtendableRenderContext,
  ): string {
    if (!this.isReady) {
      throw new Error('Artifact 还未初始化');
    }

    const targetTemplateEngine = templateEngine || this.options.templateEngine;

    if (!targetTemplateEngine) {
      throw new Error('没有可用的 Nunjucks 环境');
    }

    const renderContext = this.getRenderContext(extendRenderContext);
    const { templateString, template } = this.artifact;
    const result = templateString
      ? targetTemplateEngine.renderString(templateString, {
          templateEngine: targetTemplateEngine,
          ...renderContext,
        })
      : targetTemplateEngine.render(`${template}.tpl`, {
          templateEngine: targetTemplateEngine,
          ...renderContext,
        });

    this.emit('renderArtifact', { artifact: this.artifact, result });

    return result;
  }

  private async providerMapper(
    providerName: string,
    { requestUserAgent }: { requestUserAgent?: string } = {},
  ): Promise<void> {
    const config = this.surgioConfig;
    const mainProviderName = this.artifact.provider;
    const filePath = path.resolve(config.providerDir, `${providerName}.js`);

    this.emit('initProvider:start', {
      artifact: this.artifact,
      providerName,
    });

    if (!fs.existsSync(filePath)) {
      throw new Error(`文件 ${filePath} 不存在`);
    }

    let provider: ThenArg<ReturnType<typeof getProvider>>;
    let nodeConfigList: ReadonlyArray<PossibleNodeConfigType>;

    try {
      // eslint-disable-next-line prefer-const
      provider = await getProvider(providerName, require(filePath));
      this.providerMap.set(providerName, provider);
    } catch (err) /* istanbul ignore next */ {
      err.message = `处理 ${providerName} 时出现错误，相关文件 ${filePath} ，错误原因: ${err.message}`;
      throw err;
    }

    try {
      nodeConfigList = await provider.getNodeList({ requestUserAgent });
    } catch (err) /* istanbul ignore next */ {
      err.message = `获取 ${providerName} 节点时出现错误，相关文件 ${filePath} ，错误原因: ${err.message}`;
      throw err;
    }

    // Filter 仅使用第一个 Provider 中的定义
    if (providerName === mainProviderName) {
      if (!this.netflixFilter) {
        this.netflixFilter = provider.netflixFilter || defaultNetflixFilter;
      }
      if (!this.youtubePremiumFilter) {
        this.youtubePremiumFilter =
          provider.youtubePremiumFilter || defaultYoutubePremiumFilter;
      }
      if (!this.customFilters) {
        this.customFilters = {
          ...config.customFilters,
          ...provider.customFilters,
        };
      }
    }

    if (
      validateFilter(provider.nodeFilter) &&
      typeof provider.nodeFilter === 'object' &&
      provider.nodeFilter.supportSort
    ) {
      nodeConfigList = provider.nodeFilter.filter(nodeConfigList);
    }

    nodeConfigList = (
      await Bluebird.map(nodeConfigList, async (nodeConfig) => {
        let isValid = false;

        if (nodeConfig.enable === false) {
          return undefined;
        }

        if (!provider.nodeFilter) {
          isValid = true;
        } else if (validateFilter(provider.nodeFilter)) {
          isValid =
            typeof provider.nodeFilter === 'function'
              ? provider.nodeFilter(nodeConfig)
              : true;
        }

        if (isValid) {
          if (config.binPath && config.binPath[nodeConfig.type]) {
            nodeConfig.binPath = config.binPath[nodeConfig.type];
            nodeConfig.localPort = provider.nextPort;
          }

          nodeConfig.provider = provider;
          nodeConfig.surgeConfig = config.surgeConfig;
          nodeConfig.clashConfig = config.clashConfig;
          nodeConfig.quantumultXConfig = config.quantumultXConfig;
          nodeConfig.surfboardConfig = config.surfboardConfig;

          if (provider.renameNode) {
            const newName = provider.renameNode(nodeConfig.nodeName);

            if (newName) {
              nodeConfig.nodeName = newName;
            }
          }

          if (provider.addFlag) {
            // 给节点名加国旗
            nodeConfig.nodeName = prependFlag(
              nodeConfig.nodeName,
              provider.removeExistingFlag,
            );
          } else if (provider.removeExistingFlag) {
            // 去掉名称中的国旗
            nodeConfig.nodeName = removeFlag(nodeConfig.nodeName);
          }

          // TCP Fast Open
          if (provider.tfo) {
            nodeConfig.tfo = provider.tfo;
          }

          // MPTCP
          if (provider.mptcp) {
            nodeConfig.mptcp = provider.mptcp;
          }

          // Underlying Proxy
          if (!nodeConfig.underlyingProxy && provider.underlyingProxy) {
            nodeConfig.underlyingProxy = provider.underlyingProxy;
          }

          // check whether the hostname resolves in case of blocking clash's node heurestic
          if (
            config?.checkHostname &&
            'hostname' in nodeConfig &&
            !isIp(nodeConfig.hostname)
          ) {
            try {
              const domains = await resolveDomain(nodeConfig.hostname);
              if (domains.length < 1) {
                logger.warn(
                  `DNS 解析结果中 ${nodeConfig.hostname} 未有对应 IP 地址，将忽略该节点`,
                );
                return undefined;
              }
            } catch (err) /* istanbul ignore next */ {
              logger.warn(`${nodeConfig.hostname} 无法解析，将忽略该节点`);
              return undefined;
            }
          }

          if (
            config?.surgeConfig?.resolveHostname &&
            'hostname' in nodeConfig &&
            !isIp(nodeConfig.hostname) &&
            [NodeTypeEnum.Vmess, NodeTypeEnum.Shadowsocksr].includes(
              nodeConfig.type,
            )
          ) {
            try {
              nodeConfig.hostnameIp = await resolveDomain(nodeConfig.hostname);
            } catch (err) /* istanbul ignore next */ {
              logger.warn(
                `${nodeConfig.hostname} 无法解析，将忽略该域名的解析结果`,
              );
            }
          }

          return nodeConfig;
        }

        return undefined;
      })
    ).filter((item): item is PossibleNodeConfigType => item !== undefined);

    this.nodeConfigListMap.set(providerName, nodeConfigList);
    this.initProgress++;

    this.emit('initProvider:end', {
      artifact: this.artifact,
      providerName,
      provider,
    });
  }
}
