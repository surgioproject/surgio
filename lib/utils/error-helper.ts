import Command from 'common-bin';
import chalk from 'chalk';
import DoctorCommand from '../command/doctor';

export const errorHandler = function (this: Command, err: Error): void {
  DoctorCommand.generateDoctorInfo(this.context.cwd).then((doctorInfo) => {
    console.error(chalk.red(`⚠️  发生错误`));
    console.error(chalk.red(`⚠️  ${err.name}: ${err.message}`));
    console.error('⚠️  版本号: %s', require('../../package.json').version);
    console.error(
      '⚠️  常见问题: %s',
      chalk.cyan('https://url.royli.dev/7EMxu'),
    );
    console.error(
      '⚠️  加入交流群汇报问题 %s',
      chalk.cyan('https://t.me/surgiotg'),
    );
    console.error();
    console.error(chalk.red(err.stack));
    console.error();
    doctorInfo.forEach((item) => {
      console.error(item);
    });
    console.error();

    process.exit(1);
  });
};
