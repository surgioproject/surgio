/* istanbul ignore file -- @preserve */

import { ESLint } from 'eslint'
// @ts-expect-error - no types available
import surgioConfig from '@surgio/eslint-config-surgio'

import { findSurgioProjectFiles } from '../project/file.js'

export const createCli = (cliConfig?: ESLint.Options): ESLint => {
  const projectUsesEsm =
    cliConfig?.cwd !== undefined &&
    findSurgioProjectFiles(cliConfig.cwd).length > 0
  const linterConfig: ESLint.Options = {
    // Use Surgio's config without loading the project's ESLint config files.
    overrideConfigFile: true,
    overrideConfig: [
      ...surgioConfig,
      {
        ignores: [
          '.surgio/**',
          'dist/**',
          'node_modules/**',
          'worker-configuration.d.ts',
          '.wrangler/**',
        ],
      },
      ...(projectUsesEsm
        ? [
            {
              files: ['**/*.js'],
              languageOptions: {
                sourceType: 'module' as const,
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

const runLint = async (cwd: string, fix: boolean): Promise<boolean> => {
  const cli = createCli({ fix, cwd })
  const results = await cli.lintFiles(['.'])

  if (fix) await ESLint.outputFixes(results)

  const formatter = await cli.loadFormatter('stylish')
  const resultText = await formatter.format(results)

  console.log(resultText)

  return results.every((result) => result.errorCount === 0)
}

export const checkAndFix = (cwd: string): Promise<boolean> => runLint(cwd, true)

export const check = (cwd: string): Promise<boolean> => runLint(cwd, false)
