import { resolve } from 'path'
import { Command, Flags, Interfaces, Config } from '@oclif/core'
import { setLogLevel } from '@surgio/logger'
import ora from 'ora'

import { unifiedCache } from './cache/singleton.js'
import { CommandConfig } from './types.js'
import { loadSurgioProject, type LoadedSurgioProject } from './project/index.js'
import { errorHandler } from './utils/error-helper.js'
import { loadModuleSync } from './utils/module-loader.js'

loadModuleSync('source-map-support/register.js')

export type Flags<T extends typeof Command> = Interfaces.InferredFlags<
  (typeof BaseCommand)['baseFlags'] & T['flags']
>
export type Args<T extends typeof Command> = Interfaces.InferredArgs<T['args']>

abstract class BaseCommand<T extends typeof Command> extends Command {
  protected flags!: Flags<T>
  protected args!: Args<T>
  protected surgioConfig!: CommandConfig
  protected surgioProject!: LoadedSurgioProject
  public ora = ora({
    stream: process.stdout,
  })
  public projectDir!: string

  constructor(argv: string[], config: Config) {
    super(argv, config)
  }

  public async init(): Promise<void> {
    await super.init()

    const { args, flags } = await this.parse({
      flags: this.ctor.flags,
      baseFlags: (super.ctor as typeof BaseCommand).baseFlags,
      args: this.ctor.args,
      strict: this.ctor.strict,
    })

    this.flags = flags as Flags<T>
    this.args = args as Args<T>

    /* istanbul ignore next -- @preserve */
    if (flags.verbose) {
      setLogLevel('debug')
    }

    if (flags.project.startsWith('.')) {
      flags.project = resolve(process.cwd(), flags.project)
    }

    this.projectDir = flags.project
    this.surgioProject = await loadSurgioProject(this.projectDir)
    this.surgioConfig = this.surgioProject.config
  }

  protected async catch(err: Error & { exitCode?: number }): Promise<any> {
    if (this.ora.isSpinning) {
      this.ora.fail()
    }
    await errorHandler.call(this, err)
    this.exit(err.exitCode || 1)
  }

  protected async cleanup(): Promise<void> {
    await unifiedCache.close()
    if (this.ora.isSpinning) {
      this.ora.succeed()
    }
  }
}

BaseCommand.enableJsonFlag = true
BaseCommand.baseFlags = {
  project: Flags.string({
    char: 'p',
    description: 'Surgio 配置目录',
    default: './',
    helpGroup: 'GLOBAL',
  }),
  verbose: Flags.boolean({
    char: 'V',
    description: '打印调试日志',
    default: false,
    helpGroup: 'GLOBAL',
  }),
}

export default BaseCommand
