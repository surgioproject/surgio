'use strict';

import assert from 'assert';
import Bluebird from 'bluebird';
import chalk from 'chalk';
import fs from 'fs-extra';
import _ from 'lodash';
import { Environment } from 'nunjucks';
import ora from 'ora';
import path from 'path';

import getEngine from './template';
import {
  ArtifactConfig,
  CommandConfig,
  NodeTypeEnum,
  PossibleNodeConfigType,
  ProviderConfig,
  RemoteSnippet,
  SimpleNodeConfig,
} from './types';
import {
  getClashNodes,
  getDownloadUrl,
  getNodeNames,
  getQuantumultNodes,
  getV2rayNNodes,
  getQuantumultXNodes,
  getShadowsocksNodes,
  getShadowsocksNodesJSON,
  getShadowsocksrNodes,
  getSurgeNodes,
  getMellowNodes,
  normalizeClashProxyGroupConfig,
  toBase64,
  toUrlSafeBase64,
} from './utils';
import { loadRemoteSnippetList } from './utils/remote-snippet';
import { isIp, resolveDomain } from './utils/dns';
import {
  hkFilter, japanFilter, koreaFilter,
  netflixFilter as defaultNetflixFilter,
  singaporeFilter,
  taiwanFilter,
  usFilter,
  validateFilter,
  youtubePremiumFilter as defaultYoutubePremiumFilter,
} from './utils/filter';
import getProvider from './utils/get-provider';
import { prependFlag } from './utils/flag';
import { NETWORK_CONCURRENCY } from './utils/constant';
import Provider from './provider/Provider';

const spinner = ora();

async function run(config: CommandConfig): Promise<void> {
  const artifactList: ReadonlyArray<ArtifactConfig> = config.artifacts;
  const distPath = config.output;
  const remoteSnippetsConfig = config.remoteSnippets || [];
  const remoteSnippetList = await loadRemoteSnippetList(remoteSnippetsConfig);
  const templateEngine = getEngine(config.templateDir, config.publicUrl);

  await fs.remove(distPath);
  await fs.mkdir(distPath);

  for (const artifact of artifactList) {
    spinner.start(`正在生成规则 ${artifact.name}`);

    try {
      const result = await generate(config, artifact, remoteSnippetList, templateEngine);
      const destFilePath = path.join(config.output, artifact.name);

      if (artifact.destDir) {
        fs.accessSync(artifact.destDir, fs.constants.W_OK);
        await fs.writeFile(path.join(artifact.destDir, artifact.name), result);
      } else {
        await fs.writeFile(destFilePath, result);
      }

      spinner.succeed(`规则 ${artifact.name} 生成成功`);
    } catch (err) {
      spinner.fail(`规则 ${artifact.name} 生成失败`);
      throw err;
    }
  }
}

export async function generate(
  config: CommandConfig,
  artifact: ArtifactConfig,
  remoteSnippetList: ReadonlyArray<RemoteSnippet>,
  templateEngine: Environment,
): Promise<string> {
  const {
    name: artifactName,
    template,
    customParams,
    templateString,
  } = artifact;

  assert(artifactName, '必须指定 artifact 的 name 属性');
  assert(artifact.provider, '必须指定 artifact 的 provider 属性');
  if (!templateString) {
    assert(template, '必须指定 artifact 的 template 属性');
  }

  const gatewayConfig = config.gateway;
  const gatewayHasToken: boolean = !!(gatewayConfig && gatewayConfig.accessToken);
  const mainProviderName = artifact.provider;
  const combineProviders = artifact.combineProviders || [];
  const providerList = [mainProviderName].concat(combineProviders);
  const nodeConfigListMap: Map<string, ReadonlyArray<PossibleNodeConfigType>> = new Map();
  const nodeList: PossibleNodeConfigType[] = [];
  const nodeNameList: SimpleNodeConfig[] = [];
  let customFilters: ProviderConfig['customFilters'];
  let netflixFilter: ProviderConfig['netflixFilter'];
  let youtubePremiumFilter: ProviderConfig['youtubePremiumFilter'];
  let progress = 0;

  if (config.binPath && config.binPath.v2ray) {
    config.binPath.vmess = config.binPath.v2ray;
  }

  const providerMapper = async (providerName: string): Promise<void> => {
    const filePath = path.resolve(config.providerDir, `${providerName}.js`);

    if (!fs.existsSync(filePath)) {
      throw new Error(`文件 ${filePath} 不存在`);
    }

    let provider: Provider;
    let nodeConfigList: ReadonlyArray<PossibleNodeConfigType>;

    try {
      provider = getProvider(require(filePath));
    } catch (err) {
      err.message = `处理 ${chalk.cyan(providerName)} 时出现错误，相关文件 ${filePath} ，错误原因: ${err.message}`;
      throw err;
    }

    try {
      nodeConfigList = await provider.getNodeList();
    } catch (err) {
      err.message = `获取 ${chalk.cyan(providerName)} 节点时出现错误，相关文件 ${filePath} ，错误原因: ${err.message}`;
      throw err;
    }

    // Filter 仅使用第一个 Provider 中的定义
    if (providerName === mainProviderName) {
      if (!netflixFilter) {
        netflixFilter = provider.netflixFilter || defaultNetflixFilter;
      }
      if (!youtubePremiumFilter) {
        youtubePremiumFilter = provider.youtubePremiumFilter || defaultYoutubePremiumFilter;
      }
      if (!customFilters) {
        customFilters = {
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

    nodeConfigList = await Bluebird.map(nodeConfigList, async nodeConfig => {
      let isValid = false;

      if (nodeConfig.enable === false) {
        return null;
      }

      if (!provider.nodeFilter) {
        isValid = true;
      } else if (validateFilter(provider.nodeFilter)) {
        isValid = typeof provider.nodeFilter === 'function' ?
          provider.nodeFilter(nodeConfig) :
          true;
      }

      if (isValid) {
        if (config.binPath && config.binPath[nodeConfig.type]) {
          nodeConfig.binPath = config.binPath[nodeConfig.type];
          nodeConfig.localPort = provider.nextPort;
        }

        nodeConfig.surgeConfig = config.surgeConfig;

        if (provider.renameNode) {
          const newName = provider.renameNode(nodeConfig.nodeName);

          if (newName) {
            nodeConfig.nodeName = newName;
          }
        }

        // 给节点名加国旗
        if (provider.addFlag) {
          nodeConfig.nodeName = prependFlag(nodeConfig.nodeName);
        }

        // TCP Fast Open
        if (provider.tfo) {
          nodeConfig.tfo = provider.tfo;
        }

        // MPTCP
        if (provider.mptcp) {
          nodeConfig.mptcp = provider.mptcp;
        }

        if (
          config.surgeConfig.resolveHostname &&
          !isIp(nodeConfig.hostname) &&
          [NodeTypeEnum.Vmess, NodeTypeEnum.Shadowsocksr].includes(nodeConfig.type)
        ) {
          try {
            nodeConfig.hostnameIp = await resolveDomain(nodeConfig.hostname);
          } /* istanbul ignore next */ catch (err) {
            console.log();
            console.warn(`${nodeConfig.hostname} 无法解析，将忽略该域名的解析结果`);
          }
        }

        return nodeConfig;
      }

      return null;
    })
      .filter(item => !!item);


    nodeConfigListMap.set(providerName, nodeConfigList);

    spinner.text = `已处理 Provider ${++progress}/${providerList.length}...`;
  };

  await Bluebird.map(providerList, providerMapper, { concurrency: NETWORK_CONCURRENCY });

  providerList.forEach(providerName => {
    const nodeConfigList = nodeConfigListMap.get(providerName);

    nodeConfigList.forEach(nodeConfig => {
      if (nodeConfig) {
        nodeNameList.push({
          type: nodeConfig.type,
          enable: nodeConfig.enable,
          nodeName: nodeConfig.nodeName,
        });
        nodeList.push(nodeConfig);
      }
    });
  });

  const renderContext = {
    proxyTestUrl: config.proxyTestUrl,
    downloadUrl: getDownloadUrl(config.urlBase, artifactName, true, gatewayHasToken ? gatewayConfig.accessToken : undefined),
    nodes: nodeList,
    names: nodeNameList,
    remoteSnippets: _.keyBy(remoteSnippetList, item => item.name),
    nodeList,
    provider: artifact.provider,
    providerName: artifact.provider,
    artifactName,
    getDownloadUrl: (name: string) => getDownloadUrl(config.urlBase, name, true, gatewayHasToken ? gatewayConfig.accessToken : undefined),
    getNodeNames,
    getClashNodes,
    getSurgeNodes,
    getShadowsocksNodes,
    getShadowsocksNodesJSON,
    getShadowsocksrNodes,
    getQuantumultNodes,
    getV2rayNNodes,
    getQuantumultXNodes,
    getMellowNodes,
    usFilter,
    hkFilter,
    japanFilter,
    koreaFilter,
    singaporeFilter,
    taiwanFilter,
    toUrlSafeBase64,
    toBase64,
    encodeURIComponent,
    netflixFilter,
    youtubePremiumFilter,
    customFilters,
    customParams: customParams || {},
    ...(artifact.proxyGroupModifier ? {
      clashProxyConfig: {
        Proxy: getClashNodes(nodeList),
        'Proxy Group': normalizeClashProxyGroupConfig(
          nodeList,
          {
            usFilter,
            hkFilter,
            japanFilter,
            koreaFilter,
            singaporeFilter,
            taiwanFilter,
            netflixFilter,
            youtubePremiumFilter,
            ...customFilters,
          },
          artifact.proxyGroupModifier,
          {
            proxyTestUrl: config.proxyTestUrl,
            proxyTestInterval: config.proxyTestInterval,
          },
        ),
      },
    } : {}),
  };

  if (templateString) {
    return templateEngine.renderString(templateString, renderContext);
  }
  return templateEngine.render(`${template}.tpl`, renderContext);
}

export default async function(config: CommandConfig): Promise<void> {
  console.log(chalk.cyan('开始生成规则'));
  await run(config)
    .catch(err => {
      if (spinner.isSpinning) {
        spinner.fail();
      }
      throw err;
    });
  console.log(chalk.cyan('规则生成成功'));
}
