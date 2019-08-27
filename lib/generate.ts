'use strict';

import assert from 'assert';
import chalk from 'chalk';
import _ from 'lodash';
import { fs } from 'mz';
import ora from 'ora';
import path from 'path';
import _rimraf from 'rimraf';
import util from 'util';
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
  ShadowsocksSubscribeProviderConfig,
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
  resolveRoot,
  toBase64,
  toUrlSafeBase64,
  usFilter,
  youtubePremiumFilter as defaultYoutubePremiumFilter,
  getShadowsocksSubscription,
} from './utils';

const rimraf = util.promisify(_rimraf);
const spinner = ora();

async function run(config: CommandConfig): Promise<void> {
  const artifactList: ReadonlyArray<ArtifactConfig> = config.artifacts;
  const distPath = resolveRoot(config.output);
  const remoteSnippetsConfig = config.remoteSnippets || [];
  const remoteSnippetList = await loadRemoteSnippetList(remoteSnippetsConfig);

  await rimraf(distPath);
  await fs.mkdir(distPath);

  for (const artifact of artifactList) {
    spinner.start(`Generating ${artifact.name}`);

    const result = await generate(config, artifact, remoteSnippetList);
    const destFilePath = resolveRoot(config.output, artifact.name);

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
    nodeFilter?: NodeFilterType;
    netflixFilter?: NodeNameFilterType;
    youtubePremiumFilter?: NodeNameFilterType;
  } = {};

  const recipeConfigList = await Promise.all(
    recipeList.map<Promise<ReadonlyArray<PossibleNodeConfigType>>>(providerName => {
      const filePath = path.resolve(config.providerDir, `${providerName}.js`);

      if (!fs.existsSync(filePath)) {
        throw new Error(`${filePath} cannot be found.`);
      }

      const file: ProviderConfig = require(filePath);

      customFilters.nodeFilter = file.nodeFilter;
      customFilters.netflixFilter = file.netflixFilter || defaultNetflixFilter;
      customFilters.youtubePremiumFilter = file.youtubePremiumFilter || defaultYoutubePremiumFilter;

      assert(file.type, 'You must specify a type.');

      switch (file.type) {
        case SupportProviderEnum.BlackSSL:
          return getBlackSSLConfig(file as BlackSSLProviderConfig);

        case SupportProviderEnum.ShadowsocksJsonSubscribe:
          return getShadowsocksJSONConfig(file as ShadowsocksJsonSubscribeProviderConfig);

        case SupportProviderEnum.ShadowsocksSubscribe:
          return getShadowsocksSubscription(file as ShadowsocksSubscribeProviderConfig);

        case SupportProviderEnum.Custom: {
          assert((file as CustomProviderConfig).nodeList, 'Lack of nodeList.');
          return Promise.resolve((file as CustomProviderConfig).nodeList);
        }

        case SupportProviderEnum.V2rayNSubscribe:
          return getV2rayNSubscription(file as V2rayNSubscribeProviderConfig);

        default:
          throw new Error(`Unsupported provider type: ${file.type}`);
      }
    })
  );

  recipeConfigList.forEach(recipeConfig => {
    return recipeConfig.forEach(nodeConfig => {
      let isValid = false;

      if (!customFilters.nodeFilter) {
        isValid = true;
      } else if (customFilters.nodeFilter(nodeConfig)) {
        isValid = true;
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
