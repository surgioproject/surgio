import chalk from 'chalk'
import { fromZodError } from 'zod-validation-error'
import { ZodError } from 'zod'

import BaseCommand from '../base-command'
import { generateDoctorInfo } from './doctor'

export const errorHandler = async function (
  this: BaseCommand<any>,
  err: Error,
): Promise<void> {
  const doctorInfo = await generateDoctorInfo(
    this.projectDir,
    this.config.pjson,
  )

  console.error()
  console.error(chalk.bgRed(' 发生错误 '))

  if (err.cause && err.cause instanceof ZodError) {
    console.error(chalk.red(err.message))
    console.error(
      chalk.red(
        fromZodError(err.cause, {
          prefix: '参数校验错误',
        }).message,
      ),
    )
  } else {
    console.error(chalk.red(err.message))
    console.error()

    if (err.stack) {
      console.error(chalk.bgRed(' 错误堆栈 '))
      console.error(chalk.yellow(err.stack))
    }
  }

  console.error()
  console.error(chalk.bgRed(' 诊断信息 '))
  console.error('版本号:', require('../../package.json').version)
  console.error('常见问题:', chalk.cyan('https://url.royli.dev/7EMxu'))
  console.error('加入交流群汇报问题 ', chalk.cyan('https://t.me/surgiotg'))
  console.error()
  doctorInfo.forEach((item) => {
    console.error(chalk.cyan(item))
  })
  console.error()
}
