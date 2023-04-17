import chalk from 'chalk';
import { fromZodError } from 'zod-validation-error';
import { ZodError } from 'zod';

import BaseCommand from '../base-command';
import { generateDoctorInfo } from './doctor';

export const errorHandler = async function (
  this: BaseCommand<any>,
  err: Error,
): Promise<void> {
  const doctorInfo = await generateDoctorInfo(
    this.projectDir,
    this.config.pjson,
  );

  console.log();
  console.log(chalk.bgRed(' 发生错误 '));

  if (err.cause && err.cause instanceof ZodError) {
    console.log(chalk.red(err.message));
    console.log(
      chalk.red(
        fromZodError(err.cause, {
          prefix: '参数校验错误',
        }).message,
      ),
    );
  } else {
    console.log(chalk.red(err.message));
    console.log();

    if (err.stack) {
      console.log(chalk.bgRed(' 错误堆栈 '));
      console.log(chalk.yellow(err.stack));
    }
  }

  console.log();
  console.log(chalk.bgRed(' 诊断信息 '));
  console.log('版本号: %s', require('../../package.json').version);
  console.log('常见问题: %s', chalk.cyan('https://url.royli.dev/7EMxu'));
  console.log('加入交流群汇报问题 %s', chalk.cyan('https://t.me/surgiotg'));
  console.log();
  doctorInfo.forEach((item) => {
    console.log(chalk.cyan(item));
  });
  console.log();
};
