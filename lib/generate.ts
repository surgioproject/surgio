'use strict';

import assert from 'assert';
import chalk from 'chalk';
import _ from 'lodash';
import fs from 'fs-extra';
import ora from 'ora';
import path from 'path';

import getEngine from './template';
import {
  ArtifactConfig,
  BlackSSLProviderConfig,
  CommandConfig,
  CustomProviderConfig,
  NodeFilterType,
  NodeNameFilterType,
  PossibleNodeConfigType,
  ProviderConfig,
  RemoteSnippet,
  ShadowsocksJsonSubscribeProviderConfig,
  SimpleNodeConfig,
  SupportProviderEnum,
  V2rayNSubscribeProviderConfig,
  ShadowsocksSubscribeProviderConfig, ShadowsocksrSubscribeProviderConfig,
} from './types';
import {
  getBlackSSLConfig,
  getClashNodeNames,
  getClashNodes,
  getDownloadUrl,
  getNodeNames,
  getQuantumultNodes,
  getShadowsocksJSONConfig,
  getShadowsocksNodes,
  getShadowsocksNodesJSON,
  getShadowsocksrNodes,
  getSurgeNodes, getV2rayNSubscription,
  hkFilter,
  loadRemoteSnippetList,
  netflixFilter as defaultNetflixFilter,
  normalizeClashProxyGroupConfig,
  toBase64,
  toUrlSafeBase64,
  usFilter,
  youtubePremiumFilter as defaultYoutubePremiumFilter,
  getShadowsocksSubscription,
  getShadowsocksrSubscription,
} from './utils';

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
    provider,
    customParams,
  } = artifact;

  assert(artifactName, 'You must specify the artifact\'s name.');
  assert(template, 'You must specify the artifact\'s template.');
  assert(provider, 'You must specify the artifact\'s provider.');

  const tplBuffer = await fs.readFile(path.resolve(config.templateDir, `${template}.tpl`));
  const recipeList = artifact.recipe ? artifact.recipe : [artifact.provider];
  const nodeList: PossibleNodeConfigType[] = [];
  const nodeNameList: SimpleNodeConfig[] = [];
  const customFilters: {
    netflixFilter?: NodeNameFilterType;
    youtubePremiumFilter?: NodeNameFilterType;
  } = {};

  for (const providerName of recipeList) {
    const filePath = path.resolve(config.providerDir, `${providerName}.js`);
    const recipeConfigList: Array<ReadonlyArray<PossibleNodeConfigType>> = [];

    if (!fs.existsSync(filePath)) {
      throw new Error(`${filePath} cannot be found.`);
    }

    const file: ProviderConfig = require(filePath);

    customFilters.netflixFilter = file.netflixFilter || defaultNetflixFilter;
    customFilters.youtubePremiumFilter = file.youtubePremiumFilter || defaultYoutubePremiumFilter;

    assert(file.type, 'You must specify a type.');

    switch (file.type) {
      case SupportProviderEnum.BlackSSL:
        recipeConfigList.push(await getBlackSSLConfig(file as BlackSSLProviderConfig));
        break;

      case SupportProviderEnum.ShadowsocksJsonSubscribe:
        recipeConfigList.push(await getShadowsocksJSONConfig(file as ShadowsocksJsonSubscribeProviderConfig));
        break;

      case SupportProviderEnum.ShadowsocksSubscribe:
        recipeConfigList.push(await getShadowsocksSubscription(file as ShadowsocksSubscribeProviderConfig));
        break;

      case SupportProviderEnum.ShadowsocksrSubscribe:
        recipeConfigList.push(await getShadowsocksrSubscription(file as ShadowsocksrSubscribeProviderConfig));
        break;

      case SupportProviderEnum.Custom: {
        assert((file as CustomProviderConfig).nodeList, 'Lack of nodeList.');
        recipeConfigList.push((file as CustomProviderConfig).nodeList);
        break;
      }

      case SupportProviderEnum.V2rayNSubscribe:
        recipeConfigList.push(await getV2rayNSubscription(file as V2rayNSubscribeProviderConfig));
        break;

      default:
        throw new Error(`Unsupported provider type: ${file.type}`);
    }

    recipeConfigList.forEach(recipeConfig => {
      recipeConfig.forEach(nodeConfig => {
        let isValid = false;

        if (!file.nodeFilter) {
          isValid = true;
        } else if (file.nodeFilter(nodeConfig)) {
          isValid = true;
        }

        if (config.binPath && config.binPath[nodeConfig.type]) {
          nodeConfig.binPath = config.binPath[nodeConfig.type];
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
    });
  }

  return templateEngine.renderString(tplBuffer.toString(), {
    downloadUrl: getDownloadUrl(config.urlBase, artifactName),
    nodes: nodeList,
    names: nodeNameList,
    remoteSnippets: _.keyBy(remoteSnippetList, item => {
      return item.name;
    }),
    nodeList,
    provider,
    providerName: provider,
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
    toUrlSafeBase64,
    toBase64,
    encodeURIComponent,
    ...customFilters,
    ...(customParams ? customParams : {}),
    ...(artifact.proxyGroupModifier ? {
      clashProxyConfig: {
        Proxy: getClashNodes(nodeList),
        'Proxy Group': normalizeClashProxyGroupConfig(
          nodeList,
          {
            hkFilter,
            usFilter,
            ...customFilters,
          },
          artifact.proxyGroupModifier
        ),
      },
    } : {}),
  });
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
