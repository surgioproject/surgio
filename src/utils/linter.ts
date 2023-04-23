// istanbul ignore file

import { ESLint } from 'eslint'
import _ from 'lodash'

export const createCli = (cliConfig?: ESLint.Options): ESLint => {
  const linterConfig = {
    // 在测试情况下 fixture 目录不包含 eslintrc，避免 eslint 读取根目录的 eslintrc
    useEslintrc: process.env.NODE_ENV !== 'test',
    extensions: ['.js'],
    baseConfig: {
      extends: ['@surgio/eslint-config-surgio'].map(
        // @ts-ignore
        require.resolve,
      ),
    },
  }

  return new ESLint({
    ...linterConfig,
    ...cliConfig,
  })
}

export const checkAndFix = async (cwd: string): Promise<boolean> => {
  const cli = createCli({ fix: true, cwd })
  const results = await cli.lintFiles(['.'])
  const errorCount = _.sumBy(results, (curr) => curr.errorCount)
  const fixableErrorCount = _.sumBy(results, (curr) => curr.fixableErrorCount)

  await ESLint.outputFixes(results)

  const formatter = await cli.loadFormatter('stylish')
  const resultText = formatter.format(results)

  console.log(resultText)

  return errorCount - fixableErrorCount === 0
}

export const check = async (cwd: string): Promise<boolean> => {
  const cli = createCli({ cwd })
  const results = await cli.lintFiles(['.'])
  const errorCount = _.sumBy(results, (curr) => curr.errorCount)
  const formatter = await cli.loadFormatter('stylish')
  const resultText = formatter.format(results)

  console.log(resultText)

  return errorCount === 0
}
