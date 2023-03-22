import { Command, Flags, Interfaces, Config } from '@oclif/core';
import { transports } from '@surgio/logger';
import type { Ora } from 'ora';

import { CommandConfig } from './types';
import { loadConfig } from './utils/config';
import { errorHandler } from './utils/error-helper';

export type Flags<T extends typeof Command> = Interfaces.InferredFlags<
  (typeof BaseCommand)['baseFlags'] & T['flags']
>;
export type Args<T extends typeof Command> = Interfaces.InferredArgs<T['args']>;

abstract class BaseCommand<T extends typeof Command> extends Command {
  protected flags!: Flags<T>;
  protected args!: Args<T>;
  protected surgioConfig!: CommandConfig;
  public ora!: Ora;

  constructor(argv: string[], config: Config) {
    super(argv, config);
  }

  public async init(): Promise<void> {
    await super.init();

    const { default: ora } = await import('ora');
    this.ora = ora();

    const { args, flags } = await this.parse({
      flags: this.ctor.flags,
      baseFlags: (super.ctor as typeof BaseCommand).baseFlags,
      args: this.ctor.args,
      strict: this.ctor.strict,
    });

    this.flags = flags as Flags<T>;
    this.args = args as Args<T>;

    // istanbul ignore next
    if (flags.verbose) {
      transports.console.level = 'debug';
    }

    this.surgioConfig = await loadConfig(process.cwd(), flags.config);
  }

  protected async catch(err: Error & { exitCode?: number }): Promise<any> {
    if (this.ora.isSpinning) {
      this.ora.fail();
    }
    await errorHandler.call(this, err);
    return super.catch(err);
  }
}

BaseCommand.enableJsonFlag = true;
BaseCommand.baseFlags = {
  config: Flags.string({
    char: 'c',
    description: '配置文件',
    default: './surgio.conf.js',
    helpGroup: 'GLOBAL',
  }),
  verbose: Flags.boolean({
    char: 'V',
    description: '打印调试日志',
    default: false,
    helpGroup: 'GLOBAL',
  }),
};

export default BaseCommand;
