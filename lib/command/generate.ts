import Command from 'common-bin';
import path from 'path';

import { loadConfig } from '../utils';
import generate from '../generate';
import { errorHandler } from '../utils/error-helper';

class GenerateCommand extends Command {
  private options: object;

  constructor(rawArgv) {
    super(rawArgv);
    this.usage = 'Usage: surgio generate';
    this.options = {
      output: {
        type: 'string',
        alias: 'o',
        description: 'folder for saving files',
      },
      config: {
        alias: 'c',
        default: './surgio.conf.js',
      },
    };
  }

  public async run(ctx): Promise<void> {
    const config = loadConfig(ctx.cwd, ctx.argv.config, {
      ...(ctx.argv.output ? {
        output: path.resolve(ctx.cwd, ctx.argv.output),
      } : null)
    });
    await generate(config);
  }

  public get description(): string {
    return 'Generate configurations';
  }

  public errorHandler(err): void {
    errorHandler.call(this, err);
  }
}

export = GenerateCommand;
