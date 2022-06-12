import Command from 'common-bin';
import redis from '../redis';
import { defineGlobalOptions } from '../utils/command';

import { getConfig, loadConfig, setConfig } from '../utils/config';
import generate from '../generate';
import { errorHandler } from '../utils/error-helper';
import { checkAndFix } from '../utils/linter';

class GenerateCommand extends Command {
  constructor(rawArgv?: string[]) {
    super(rawArgv);
    this.usage = '使用方法: surgio generate';
    this.options = {
      o: {
        type: 'string',
        alias: 'output',
        description: '生成规则的目录',
      },
      'cache-snippet': {
        type: 'boolean',
        default: false,
        description: '缓存远程片段',
      },
      'skip-fail': {
        type: 'boolean',
        default: false,
        description: '跳过生成失败的 Artifact',
      },
      'skip-lint': {
        type: 'boolean',
        default: false,
        description: '跳过代码检查',
      },
    };

    defineGlobalOptions(this.yargs);
  }

  public async run(ctx): Promise<void> {
    loadConfig(ctx.cwd, ctx.argv.config);

    if (!ctx.argv.skipLint) {
      const result = await checkAndFix(ctx.cwd);

      if (!result) {
        throw new Error(
          'JS 语法检查不通过，请根据提示修改文件（参考 https://url.royli.dev/SeB6m）',
        );
      }
    }

    if (ctx.argv.output) {
      setConfig('output', ctx.argv.output);
    }

    await generate(getConfig(), ctx.argv.skipFail, ctx.argv.cacheSnippet);

    await redis.destroyRedis();
  }

  // istanbul ignore next
  public get description(): string {
    return '生成规则';
  }

  // istanbul ignore next
  public errorHandler(err): void {
    errorHandler.call(this, err);
  }
}

export = GenerateCommand;
