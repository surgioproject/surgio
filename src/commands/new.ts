// istanbul ignore file
import { Args } from '@oclif/core';
import { join } from 'path';
import { runner, Logger } from '@royli/hygen';

import BaseCommand from '../base-command';
const defaultTemplates = join(__dirname, '../../hygen-template');

class NewCommand extends BaseCommand<typeof NewCommand> {
  static description = '新建文件助手';

  public async run(): Promise<void> {
    const args: string[] = [...this.argv].concat('new'); // [type] new ...

    await runner(args, {
      templates: defaultTemplates,
      cwd: process.cwd(),
      logger: new Logger(console.log.bind(console)),
      createPrompter: () => require('inquirer'),
      exec: (action, body) => {
        const opts = body && body.length > 0 ? { input: body } : {};
        return require('execa').shell(action, opts);
      },
    });
  }
}

NewCommand.args = {
  type: Args.custom({
    description: '文件类型',
    required: true,
    options: ['provider', 'template', 'artifact'],
  })(),
};

export default NewCommand;
