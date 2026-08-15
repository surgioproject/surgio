/* istanbul ignore file -- @preserve */
import { fileURLToPath } from 'node:url'
import { Args } from '@oclif/core'
import { runner, Logger } from '@royli/hygen'
import execa from 'execa'

import BaseCommand from '../base-command.js'
import { loadModuleSync } from '../utils/module-loader.js'
const defaultTemplates = fileURLToPath(
  new URL('../../hygen-template', import.meta.url),
)

class NewCommand extends BaseCommand<typeof NewCommand> {
  static description = '新建文件助手'

  public async run(): Promise<void> {
    const args: string[] = [...this.argv].concat('new') // [type] new ...

    await runner(args, {
      templates: defaultTemplates,
      cwd: this.projectDir,
      logger: new Logger(console.log.bind(console)),
      createPrompter: () => loadModuleSync<any>('inquirer'),
      exec: async (action, body) => {
        const opts = body && body.length > 0 ? { input: body } : {}
        await execa(action, opts)
      },
    })

    await this.cleanup()
  }
}

NewCommand.args = {
  type: Args.custom({
    description: '文件类型',
    required: true,
    options: ['provider', 'template', 'artifact'],
  })(),
}

export default NewCommand
