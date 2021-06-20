// istanbul ignore file
import Command from 'common-bin';
import { check, checkAndFix } from '../utils/linter';

class LintCommand extends Command {
  constructor(rawArgv?: string[]) {
    super(rawArgv);
    this.usage = '使用方法: surgio lint [--fix]';
    this.options = {
      fix: {
        default: false,
        describe: '自动修复部分 Lint 错误',
        type: 'boolean',
      },
    };
  }

  // istanbul ignore next
  public get description(): string {
    return '运行 JS 语法检查';
  }

  public async run(ctx): Promise<void> {
    let result;

    if (ctx.argv.fix) {
      result = await checkAndFix(ctx.cwd);
    } else {
      result = await check(ctx.cwd);
    }

    if (!result) {
      console.warn(
        '⚠️  JS 语法检查不通过，请根据提示修改文件（可添加参数 --fix 自动修复部分错误， 参考 http://url.royli.dev/SeB6m）',
      );
      process.exit(1);
    } else {
      console.log('✅  JS 语法检查通过');
    }
  }
}

export = LintCommand;
