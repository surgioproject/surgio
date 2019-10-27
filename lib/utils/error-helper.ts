import Command from 'common-bin';
import chalk from 'chalk';
import pkg from '../../package.json';

export const errorHandler = function(this: Command, err: Error): void {
  console.error(chalk.red(`⚠️  发生错误`));
  console.error(chalk.red(`⚠️  ${err.name}: ${err.message}`));
  // console.error('⚠️  命令参数: %s', process.argv.slice(3));
  console.error('⚠️  版本号: %s', pkg.version);
  console.error('⚠️  加入交流群汇报问题 %s', chalk.cyan('https://t.me/surgiotg'));
  console.error();
  console.error(chalk.red(err.stack));
  process.exit(1);
};
