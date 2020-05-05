// istanbul ignore file

import { CLIEngine } from 'eslint';

const linterConfig = {
  baseConfig: {
    extends: ['eslint:recommended'],
    parserOptions: {
      ecmaVersion: 2020
    },
    env: {
      es6: true,
      node: true,
      commonjs: true,
    },
    rules: {
      'array-bracket-spacing': 0,
      'comma-dangle': 0,
      'dot-notation': 0,
      'valid-jsdoc': 0,
      'no-unused-vars': 0,
      'eqeqeq': 'error',
    },
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
  const { errorCount, fixableErrorCount } = report;

  console.log(formatter(report.results));

  if (errorCount - fixableErrorCount > 0) {
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

