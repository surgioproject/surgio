// istanbul ignore file
import { createLogger } from '@surgio/logger';
import { join } from 'path';
import { runner, Logger } from 'hygen';
import Command, { Context } from 'common-bin';

import { defineGlobalOptions } from '../utils/command';

const defaultTemplates = join(__dirname, '../../hygen-template');
const logger = createLogger({ service: 'surgio:NewCommand' });

class NewCommand extends Command {
  constructor(rawArgv?: string[]) {
    super(rawArgv);
    this.usage = '使用方法: surgio new [provider|template|artifact]';

    defineGlobalOptions(this.yargs);
  }

  // istanbul ignore next
  public get description(): string {
    return '新建文件助手';
  }

  public async run(ctx: Context): Promise<void> {
    if (!ctx.rawArgv.length) {
      logger.error('请指定新建类型\n');
      this.showHelp();
      return;
    }

    const args: string[] = [...ctx.rawArgv].concat('new'); // [type] new ...

    runner(args, {
      templates: defaultTemplates,
      cwd: process.cwd(),
      logger: new Logger(console.log.bind(console)),
      createPrompter: () => require('inquirer'),
      exec: (action, body) => {
        const opts = body && body.length > 0 ? { input: body } : {};
        return require('execa').shell(action, opts);
      },
      debug: !!process.env.DEBUG,
    });
  }
}

export = NewCommand;
