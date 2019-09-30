// istanbul ignore file
import assert from 'assert';
import Command from 'common-bin';
import fs from 'fs';
import path from 'path';

import {
  loadConfig
} from '../utils';
import getProvider from '../utils/getProvider';

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
    const file: any|Error = fs.existsSync(filePath) ? require(filePath) : new Error('Provider file cannot be found.');

    if (file instanceof Error) {
      throw file;
    }

    const provider = getProvider(file);
    const nodeList = await provider.getNodeList();

    console.log(JSON.stringify(nodeList, null ,2));
  }

  public get description(): string {
    return 'Check configurations from provider';
  }
}

export = CheckCommand;
