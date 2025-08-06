import chalk from 'chalk'
import { fromZodError } from 'zod-validation-error'

import BaseCommand from '../base-command'

import { generateDoctorInfo } from './doctor'
import { isError, isSurgioError, isZodError } from './errors'

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

  if (isSurgioError(err)) {
    console.error(chalk.red(err.message))

    if (err.providerName) {
      console.error(chalk.red(`Provider 名称：${err.providerName}`))
    }
    if (err.providerPath) {
      console.error(chalk.red(`文件地址：${err.providerPath}`))
    }
    if (typeof err.nodeIndex === 'number') {
      console.error(chalk.red(`错误发生在第 ${err.nodeIndex + 1} 个节点`))
    }
    if (isZodError(err.cause)) {
      console.error(
        chalk.red(
          fromZodError(err.cause, {
            prefix: '原因',
          }).message,
        ),
      )
    } else if (isError(err.cause)) {
      console.error()
      console.error(chalk.bgRed(' 原因 '))
      console.error(chalk.red(err.cause.stack || err.cause))
    } else {
      console.error()
      console.error(chalk.bgRed(' 错误堆栈 '))
      console.error(chalk.yellow(err.stack))
    }
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
  console.error('版本号：', require('../../package.json').version)
  console.error('常见问题：', chalk.cyan('https://url.royli.dev/7EMxu'))
  console.error(
    '加入交流群汇报问题 ',
    chalk.cyan('https://url.royli.dev/surgiotg'),
  )
  console.error()
  doctorInfo.forEach((item) => {
    console.error(chalk.cyan(item))
  })
  console.error()
}
