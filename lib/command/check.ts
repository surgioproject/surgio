// istanbul ignore file
import assert from 'assert';
import Command from 'common-bin';
import fs from 'fs';
import path from 'path';

import {
  loadConfig
} from '../utils/config';
import { getProvider } from '../provider';
import { errorHandler } from '../utils/error-helper';

class CheckCommand extends Command {
  private options: object;

  constructor(rawArgv) {
    super(rawArgv);
    this.usage = '使用方法: surgio check [provider]';
    this.options = {
      c: {
        alias: 'config',
        demandOption: false,
        describe: 'Surgio 配置文件',
        default: './surgio.conf.js',
        type: 'string',
      },
    };
  }

  public async run(ctx): Promise<void> {
    assert(ctx.argv._[0], '没有指定 Provider');

    const providerName = ctx.argv._[0];
    const config = loadConfig(ctx.cwd, ctx.argv.config);
    const filePath = path.resolve(config.providerDir, `./${providerName}.js`);
    const file: any|Error = fs.existsSync(filePath) ? require(filePath) : new Error('找不到该 Provider');

    if (file instanceof Error) {
      throw file;
    }

    const provider = getProvider(providerName, file);
    const nodeList = await provider.getNodeList();

    console.log(JSON.stringify(nodeList, null ,2));
  }

  public get description(): string {
    return '查询 Provider';
  }

  public errorHandler(err): void {
    errorHandler.call(this, err);
  }
}

export = CheckCommand;
