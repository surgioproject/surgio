/* istanbul ignore file -- @preserve */

import { ESLint } from 'eslint'
// @ts-expect-error - no types available
import surgioConfig from '@surgio/eslint-config-surgio'
import _ from 'lodash'
import tseslint from 'typescript-eslint'

import { findSurgioProjectFiles } from '../project/file.js'

export const createCli = (cliConfig?: ESLint.Options): ESLint => {
  const projectUsesEsm =
    cliConfig?.cwd !== undefined &&
    findSurgioProjectFiles(cliConfig.cwd).length > 0
  const linterConfig: ESLint.Options = {
    // In ESLint 9 flat config, we use overrideConfigFile to specify a config array
    // When in test mode, we only use the surgioConfig without reading user's config files
    overrideConfigFile: true,
    overrideConfig: [
      ...surgioConfig,
      { ignores: ['.surgio/**', 'dist/**', 'node_modules/**'] },
      ...(projectUsesEsm
        ? [
            {
              files: ['**/*.{js,mjs}'],
              languageOptions: {
                ecmaVersion: 'latest' as const,
                sourceType: 'module' as const,
              },
            },
            {
              files: ['**/*.{ts,mts}'],
              ignores: ['**/*.d.ts'],
              languageOptions: {
                ecmaVersion: 'latest' as const,
                parser: tseslint.parser,
                sourceType: 'module' as const,
              },
              rules: {
                'no-undef': 'off' as const,
              },
            },
          ]
        : []),
    ],
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
