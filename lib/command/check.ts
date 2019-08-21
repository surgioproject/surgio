import assert from 'assert';
import Command from 'common-bin';
import fs from 'fs';
import path from 'path';

import {
  BlackSSLProviderConfig,
  CustomProviderConfig,
  PossibleNodeConfigType,
  ProviderConfig,
  ShadowsocksJsonSubscribeProviderConfig,
  SupportProviderEnum,
} from '../types';
import {
  getBlackSSLConfig,
  getShadowsocksJSONConfig,
  loadConfig
} from '../utils';

class CheckCommand extends Command {
  private options: object;

  constructor(rawArgv) {
    super(rawArgv);
    this.usage = 'Usage: surgio check [provider]';
    this.options = {
      config: {
        alias: 'c',
        default: './surgio.conf.js',
      },
    };
  }

  public async run(ctx): Promise<void> {
    assert(ctx.argv._[0], 'No provider specified.');

    const providerName = ctx.argv._[0];
    const config = loadConfig(ctx.cwd, ctx.argv.config);
    const filePath = path.resolve(config.providerDir, `./${providerName}.js`);
    const file: ProviderConfig|Error = fs.existsSync(filePath) ? require(filePath) : new Error('Provider file cannot be found.');

    if (file instanceof Error) {
      throw file;
    }

    const configList = await this.requestRemoteFile(file);

    console.log(JSON.stringify(configList, null ,2));
  }

  public get description(): string {
    return 'Check configurations from provider';
  }

  private async requestRemoteFile(file: ProviderConfig): Promise<ReadonlyArray<PossibleNodeConfigType>> {
    switch (file.type) {
      case SupportProviderEnum.BlackSSL:
        return getBlackSSLConfig(file as BlackSSLProviderConfig);

      case SupportProviderEnum.ShadowsocksJsonSubscribe:
        return getShadowsocksJSONConfig(file as ShadowsocksJsonSubscribeProviderConfig);

      case SupportProviderEnum.Custom:
        return (file as CustomProviderConfig).nodeList;

      default:
        throw new Error(`Unsupported provider type: ${file.type}`);
    }
  }
}

export = CheckCommand;
