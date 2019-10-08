'use strict';

import assert from 'assert';
import chalk from 'chalk';
import fs from 'fs-extra';
import _ from 'lodash';
import ora from 'ora';
import path from 'path';

import getEngine from './template';
import {
  ArtifactConfig,
  CommandConfig,
  NodeNameFilterType,
  PossibleNodeConfigType,
  ProviderConfig,
  RemoteSnippet,
  SimpleNodeConfig,
} from './types';
import {
  getClashNodeNames,
  getClashNodes,
  getDownloadUrl,
  getNodeNames,
  getQuantumultNodes,
  getShadowsocksNodes,
  getShadowsocksNodesJSON,
  getShadowsocksrNodes,
  getSurgeNodes,
  loadRemoteSnippetList,
  normalizeClashProxyGroupConfig,
  toBase64,
  toUrlSafeBase64,
} from './utils';
import {
  hkFilter, japanFilter, koreaFilter,
  netflixFilter as defaultNetflixFilter, singaporeFilter, taiwanFilter,
  usFilter,
  youtubePremiumFilter as defaultYoutubePremiumFilter,
} from './utils/filter';
import getProvider from './utils/getProvider';
import { prependFlag } from './utils/flag';

const spinner = ora();

async function run(config: CommandConfig): Promise<void> {
  const artifactList: ReadonlyArray<ArtifactConfig> = config.artifacts;
  const distPath = config.output;
  const remoteSnippetsConfig = config.remoteSnippets || [];
  const remoteSnippetList = await loadRemoteSnippetList(remoteSnippetsConfig);

  await fs.remove(distPath);
  await fs.mkdir(distPath);

  for (const artifact of artifactList) {
    spinner.start(`Generating ${artifact.name}`);

    const result = await generate(config, artifact, remoteSnippetList);
    const destFilePath = path.join(config.output, artifact.name);

    await fs.writeFile(destFilePath, result);
    spinner.succeed();
  }
}

export async function generate(
  config: CommandConfig,
  artifact: ArtifactConfig,
  remoteSnippetList: ReadonlyArray<RemoteSnippet>
): Promise<string> {
  const templateEngine = getEngine(config.templateDir);
  const {
    name: artifactName,
    template,
    customParams,
  } = artifact;

  assert(artifactName, 'You must specify the artifact\'s name.');
  assert(template, 'You must specify the artifact\'s template.');
  assert(artifact.provider, 'You must specify the artifact\'s provider.');

  const recipeList = artifact.recipe ? artifact.recipe : [artifact.provider];
  const nodeList: PossibleNodeConfigType[] = [];
  const nodeNameList: SimpleNodeConfig[] = [];
  let customFilters: ProviderConfig['customFilters'];
  let netflixFilter: NodeNameFilterType;
  let youtubePremiumFilter: NodeNameFilterType;

  if (config.binPath && config.binPath.v2ray) {
    config.binPath.vmess = config.binPath.v2ray;
  }

  for (const providerName of recipeList) {
    const filePath = path.resolve(config.providerDir, `${providerName}.js`);

    if (!fs.existsSync(filePath)) {
      throw new Error(`${filePath} cannot be found.`);
    }

    const provider = getProvider(require(filePath));
    const nodeConfigList = await provider.getNodeList();

    if (!netflixFilter) {
      netflixFilter = provider.netflixFilter || defaultNetflixFilter;
    }
    if (!youtubePremiumFilter) {
      youtubePremiumFilter = provider.youtubePremiumFilter || defaultYoutubePremiumFilter;
    }
    if (!customFilters) {
      customFilters = provider.customFilters;
    }

    nodeConfigList.forEach(nodeConfig => {
      let isValid = false;

      if (!provider.nodeFilter) {
        isValid = true;
      } else if (provider.nodeFilter(nodeConfig)) {
        isValid = true;
      }

      if (config.binPath && config.binPath[nodeConfig.type]) {
        nodeConfig.binPath = config.binPath[nodeConfig.type];
        nodeConfig.localPort = provider.nextPort;
      }

      nodeConfig.surgeConfig = config.surgeConfig;

      if (provider.addFlag) {
        nodeConfig.nodeName = prependFlag(nodeConfig.nodeName);
      }

      if (isValid) {
        nodeNameList.push({
          type: nodeConfig.type,
          enable: nodeConfig.enable,
          nodeName: nodeConfig.nodeName,
        });
        nodeList.push(nodeConfig);
      }
    });
  }

  try {
    return templateEngine.render(`${template}.tpl`, {
      downloadUrl: getDownloadUrl(config.urlBase, artifactName),
      nodes: nodeList,
      names: nodeNameList,
      remoteSnippets: _.keyBy(remoteSnippetList, item => {
        return item.name;
      }),
      nodeList,
      provider: artifact.provider,
      providerName: artifact.provider,
      artifactName,
      getDownloadUrl: (name: string) => getDownloadUrl(config.urlBase, name),
      getNodeNames,
      getClashNodes,
      getClashNodeNames,
      getSurgeNodes,
      getShadowsocksNodes,
      getShadowsocksNodesJSON,
      getShadowsocksrNodes,
      getQuantumultNodes,
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
      ...(customParams ? customParams : {}),
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
            artifact.proxyGroupModifier
          ),
        },
      } : {}),
    });
  } catch (err) {
    console.error('模板渲染错误');
    throw err;
  }

}

export default async function(config: CommandConfig): Promise<void> {
  console.log(chalk.cyan('Start generating configs.'));
  await run(config)
    .catch(err => {
      spinner.fail();
      throw err;
    });
  console.log(chalk.cyan('Configs generated successfully.'));
}
