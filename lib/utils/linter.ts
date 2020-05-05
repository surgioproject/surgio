// istanbul ignore file

import { CLIEngine } from 'eslint';

const linterConfig = {
  useEslintrc: true,
  baseConfig: {
    extends: [
      '@surgio/eslint-config-surgio',
    ].map(
      // @ts-ignore
      require.resolve
    ),
  },
};

export const createCli = (cliConfig?: object) => {
  return new CLIEngine({
    ...linterConfig,
    ...cliConfig,
  });
};

export const checkAndFix = (cwd: string): boolean => {
  const cli = createCli({ fix: true, cwd, });
  const report = cli.executeOnFiles(['.']);
  const formatter = cli.getFormatter();
  const { errorCount } = report;

  console.log(formatter(report.results));

  CLIEngine.outputFixes(report);

  if (errorCount > 0) {
    throw new Error('ESLint 测试不通过');
  }

  return true;
};

export const check = (cwd: string): boolean => {
  const cli = createCli({ cwd, });
  const report = cli.executeOnFiles(['.']);
  const formatter = cli.getFormatter();
  const { errorCount } = report;

  console.log(formatter(report.results));

  return errorCount === 0;
};

