import { ESLint } from 'eslint'
import { describe, expect, test } from 'vitest'

import config from './index.js'

const eslint = new ESLint({
  overrideConfig: config,
  overrideConfigFile: true,
})

const lint = async (code, filePath = 'surgio.project.ts') => {
  const [result] = await eslint.lintText(code, { filePath })

  return result.messages
}

describe('TypeScript config', () => {
  test('lints erasable ESM TypeScript without a tsconfig', async () => {
    const messages = await lint(`
      import type { SurgioProjectConfig } from 'surgio/project'

      const projectName: string = 'typed-project'
      const project = { projectName } satisfies SurgioProjectConfig

      export default project
    `)

    expect(messages).toEqual([])
  })

  test('stays syntax-only and keeps unused variables allowed', async () => {
    const messages = await lint(`
      const projectName: number = 'typed-project'
      const unusedValue: string = 'unused'

      export default { projectName }
    `)

    expect(messages).toEqual([])
  })

  test('requires type-only imports', async () => {
    const messages = await lint(`
      import { SurgioProjectConfig } from 'surgio/project'

      const project = {} satisfies SurgioProjectConfig
      export default project
    `)

    expect(messages).toEqual([
      expect.objectContaining({
        ruleId: '@typescript-eslint/consistent-type-imports',
      }),
    ])
  })

  test.each([
    {
      code: 'enum Mode { Global }\nexport default Mode.Global',
      syntax: 'enums',
    },
    {
      code: 'namespace Config { export const name = "demo" }\nexport default Config',
      syntax: 'namespaces',
    },
    {
      code: 'class Config { constructor(public name: string) {} }\nexport default Config',
      syntax: 'parameter properties',
    },
    {
      code: 'import Config = require("./config.cts")\nexport default Config',
      syntax: 'import aliases',
    },
    {
      code: '@sealed\nclass Config {}\nexport default Config',
      syntax: 'Decorators',
    },
  ])('rejects Node-incompatible $syntax', async ({ code, syntax }) => {
    const messages = await lint(code)

    expect(messages).toEqual([
      expect.objectContaining({
        message: expect.stringContaining(syntax),
        ruleId: 'no-restricted-syntax',
      }),
    ])
  })

  test('allows ambient declarations that are erased by Node', async () => {
    const messages = await lint(`
      declare enum Mode { Global }
      declare namespace Config { type Name = string }

      export default {}
    `)

    expect(messages).toEqual([])
  })

  test('parses CommonJS TypeScript in cts files', async () => {
    const messages = await lint(
      `
        const isMissing = (value: unknown) => value == null
        module.exports = { isMissing }
      `,
      'config.cts',
    )

    expect(messages).toEqual([])
  })
})

describe('JavaScript config', () => {
  test('parses ESM in mjs files', async () => {
    const messages = await lint(
      `
        import surgio from '@surgio/eslint-config-surgio'
        export default surgio
      `,
      'eslint.config.mjs',
    )

    expect(messages).toEqual([])
  })

  test('preserves the existing CommonJS rules', async () => {
    const messages = await lint(
      `
        const isMissing = (value) => value == null
        module.exports = { isMissing }
      `,
      'surgio.conf.js',
    )

    expect(messages).toEqual([])
  })
})
