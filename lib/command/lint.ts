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

  public async run(ctx): Promise<void> {
    let result;

    if (ctx.argv.fix) {
      result = await checkAndFix(ctx.cwd);
    } else {
      result = await check(ctx.cwd);
    }

    if (!result) {
      console.log('⚠️  ESLint 测试不通过');
      process.exit(1);
    } else {
      console.log('✅  ESLint 检查通过');
    }
  }
}

export = LintCommand;
