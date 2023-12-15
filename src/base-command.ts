import 'source-map-support/register'
import { Command, Flags, Interfaces, Config } from '@oclif/core'
import { transports } from '@surgio/logger'
import ora from 'ora'
import { resolve } from 'path'
import redis from './redis'

import { CommandConfig } from './types'
import { loadConfig } from './config'
import { errorHandler } from './utils/error-helper'

export type Flags<T extends typeof Command> = Interfaces.InferredFlags<
  (typeof BaseCommand)['baseFlags'] & T['flags']
>
export type Args<T extends typeof Command> = Interfaces.InferredArgs<T['args']>

abstract class BaseCommand<T extends typeof Command> extends Command {
  protected flags!: Flags<T>
  protected args!: Args<T>
  protected surgioConfig!: CommandConfig
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

    // istanbul ignore next
    if (flags.verbose) {
      transports.console.level = 'debug'
    }

    if (flags.project.startsWith('.')) {
      flags.project = resolve(process.cwd(), flags.project)
    }

    this.projectDir = flags.project
    this.surgioConfig = loadConfig(this.projectDir)
  }

  protected async catch(err: Error & { exitCode?: number }): Promise<any> {
    if (this.ora.isSpinning) {
      this.ora.fail()
    }
    await errorHandler.call(this, err)
    this.exit(err.exitCode || 1)
  }

  protected async cleanup(): Promise<void> {
    await redis.destroyRedis()
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
