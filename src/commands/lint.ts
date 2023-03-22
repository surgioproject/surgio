// istanbul ignore file
import { Flags } from '@oclif/core';

import BaseCommand from '../base-command';
import { check, checkAndFix } from '../utils/linter';

class LintCommand extends BaseCommand<typeof LintCommand> {
  static description = '运行 JS 语法检查';

  public async run(): Promise<void> {
    let result;

    if (this.flags.fix) {
      result = await checkAndFix(process.cwd());
    } else {
      result = await check(process.cwd());
    }

    if (!result) {
      console.warn(
        '⚠️  JS 语法检查不通过，请根据提示修改文件（可添加参数 --fix 自动修复部分错误， 参考 https://url.royli.dev/SeB6m）',
      );
      process.exit(1);
    } else {
      console.log('✅  JS 语法检查通过');
    }
  }
}

LintCommand.flags = {
  fix: Flags.boolean({
    default: false,
    description: '自动修复部分 Lint 错误',
  }),
};

export default LintCommand;
