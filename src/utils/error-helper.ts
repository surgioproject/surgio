import { Command } from '@oclif/core';
import chalk from 'chalk';

import { generateDoctorInfo } from './doctor';

export const errorHandler = async function (
  this: Command,
  err: Error,
): Promise<void> {
  const doctorInfo = await generateDoctorInfo(process.cwd(), this.config.pjson);

  console.error();
  console.error(chalk.red(`❌ 发生错误 ❌`));
  console.error(chalk.red(`${err.name}: ${err.message || '未知错误'}`));
  console.error();
  console.error('版本号: %s', require('../../package.json').version);
  console.error('常见问题: %s', chalk.cyan('https://url.royli.dev/7EMxu'));
  console.error('加入交流群汇报问题 %s', chalk.cyan('https://t.me/surgiotg'));
  console.error();
  doctorInfo.forEach((item) => {
    console.error(item);
  });
  console.error();
};
