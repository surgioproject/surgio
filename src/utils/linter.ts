// istanbul ignore file

import { ESLint } from 'eslint'
import _ from 'lodash'
// @ts-expect-error - no types available
import surgioConfig from '@surgio/eslint-config-surgio'

export const createCli = (cliConfig?: ESLint.Options): ESLint => {
  const linterConfig: ESLint.Options = {
    // In ESLint 9 flat config, we use overrideConfigFile to specify a config array
    // When in test mode, we only use the surgioConfig without reading user's config files
    overrideConfigFile: true,
    overrideConfig: surgioConfig,
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
  const resultText = await formatter.format(results)

  console.log(resultText)

  return errorCount - fixableErrorCount === 0
}

export const check = async (cwd: string): Promise<boolean> => {
  const cli = createCli({ cwd })
  const results = await cli.lintFiles(['.'])
  const errorCount = _.sumBy(results, (curr) => curr.errorCount)
  const formatter = await cli.loadFormatter('stylish')
  const resultText = await formatter.format(results)

  console.log(resultText)

  return errorCount === 0
}
