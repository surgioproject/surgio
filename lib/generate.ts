'use strict';

import fs from 'fs-extra';
import { Environment } from 'nunjucks';
import ora from 'ora';
import path from 'path';
import { logger } from '@surgio/logger';
import { Artifact } from './generator/artifact';

import { getEngine } from './generator/template';
import { ArtifactConfig, CommandConfig, RemoteSnippet } from './types';
import { loadRemoteSnippetList } from './utils/remote-snippet';

const spinner = ora();

async function run(
  config: CommandConfig,
  skipFail?: boolean,
  cacheSnippet?: boolean,
): Promise<void> {
  const artifactList: ReadonlyArray<ArtifactConfig> = config.artifacts;
  const distPath = config.output;
  const remoteSnippetsConfig = config.remoteSnippets || [];
  const remoteSnippetList = await loadRemoteSnippetList(
    remoteSnippetsConfig,
    cacheSnippet,
  );
  const templateEngine = getEngine(config.templateDir);

  await fs.mkdirp(distPath);

  for (const artifact of artifactList) {
    spinner.start(`正在生成规则 ${artifact.name}`);

    try {
      const artifactInstance = new Artifact(config, artifact, {
        remoteSnippetList,
      });

      artifactInstance.once('initProvider:end', () => {
        spinner.text = `已处理 Provider ${artifactInstance.initProgress}/${artifactInstance.providerNameList.length}...`;
      });

      await artifactInstance.init();

      const result = artifactInstance.render(templateEngine);
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

      // istanbul ignore next
      if (skipFail) {
        console.error(err.stack || err);
      } else {
        throw err;
      }
    }
  }
}

export async function generate(
  config: CommandConfig,
  artifact: ArtifactConfig,
  remoteSnippetList: ReadonlyArray<RemoteSnippet>,
  templateEngine: Environment,
): Promise<string> {
  const artifactInstance = new Artifact(config, artifact, {
    remoteSnippetList,
  });

  await artifactInstance.init();

  return artifactInstance.render(templateEngine);
}

export default async function (
  config: CommandConfig,
  skipFail?: boolean,
  cacheSnippet?: boolean,
): Promise<void> {
  logger.info('开始生成规则');
  await run(config, skipFail, cacheSnippet).catch((err) => {
    // istanbul ignore next
    if (spinner.isSpinning) {
      spinner.fail();
    }
    throw err;
  });
  logger.info('规则生成成功');
}
