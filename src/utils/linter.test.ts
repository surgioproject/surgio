import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, expect, test, vi } from 'vitest'
import { ESLint } from 'eslint'

import { check, checkAndFix } from './linter.js'

const directories: string[] = []

const createProject = async (filename: string, source: string) => {
  const directory = await mkdtemp(path.join(tmpdir(), 'surgio-linter-'))
  directories.push(directory)
  await writeFile(path.join(directory, filename), source)
  vi.spyOn(console, 'log').mockImplementation(() => undefined)
  return directory
}

afterEach(async () => {
  vi.restoreAllMocks()
  await Promise.all(
    directories
      .splice(0)
      .map((directory) => rm(directory, { force: true, recursive: true })),
  )
})

test('lints native TypeScript Project files', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'surgio-linter-'))
  directories.push(directory)
  await writeFile(
    path.join(directory, 'surgio.project.ts'),
    [
      "const projectName: string = 'typed-project'",
      'export default { projectName }',
    ].join('\n'),
  )
  vi.spyOn(console, 'log').mockImplementation(() => undefined)

  await expect(check(directory)).resolves.toBe(true)
})

test.each([
  [
    'surgio.conf.js',
    "module.exports = { name: require('node:path').basename(__dirname) }",
  ],
  [
    'surgio.project.js',
    "import path from 'node:path'; export default { name: path.basename('/tmp') }",
  ],
  ['surgio.project.mjs', 'export default {}'],
  [
    'surgio.project.mts',
    "const name: string = 'project'; export default { name }",
  ],
])('lints %s with its expected module syntax', async (filename, source) => {
  const directory = await createProject(filename, source)
  await expect(check(directory)).resolves.toBe(true)
})

test('writes automatic fixes and reports the remaining result', async () => {
  const source =
    "import { Stats } from 'node:fs'; const stat: Stats | undefined = undefined; export default { stat }"
  const directory = await createProject('surgio.project.ts', source)
  const filename = path.join(directory, 'surgio.project.ts')

  await expect(check(directory)).resolves.toBe(false)
  expect(await readFile(filename, 'utf8')).toBe(source)
  await expect(checkAndFix(directory)).resolves.toBe(true)
  expect(await readFile(filename, 'utf8')).toContain('import type { Stats }')
  await expect(check(directory)).resolves.toBe(true)
})

test('reports unfixable errors after automatic fixes', async () => {
  const directory = await createProject(
    'surgio.conf.js',
    'module.exports = missingName',
  )
  await expect(checkAndFix(directory)).resolves.toBe(false)
})

test('reports errors still marked fixable after ESLint stops fixing', async () => {
  const source = "export default 'left'"
  const directory = await createProject('surgio.project.js', source)
  const eslint = new ESLint({
    cwd: directory,
    fix: true,
    overrideConfigFile: true,
    overrideConfig: [
      {
        plugins: {
          circular: {
            rules: {
              flip: {
                meta: { fixable: 'code', schema: [] },
                create(context) {
                  return {
                    Literal(node) {
                      if (node.value !== 'left' && node.value !== 'right')
                        return
                      context.report({
                        node,
                        message: 'Flip the literal',
                        fix: (fixer) =>
                          fixer.replaceText(
                            node,
                            node.value === 'left' ? "'right'" : "'left'",
                          ),
                      })
                    },
                  }
                },
              },
            },
          },
        },
        rules: { 'circular/flip': 'error' },
      },
    ],
  })
  const results = await eslint.lintText(source, {
    filePath: path.join(directory, 'surgio.project.js'),
  })
  expect(results[0].errorCount).toBeGreaterThan(0)
  expect(results[0].fixableErrorCount).toBe(results[0].errorCount)
  vi.spyOn(ESLint.prototype, 'lintFiles').mockResolvedValueOnce(results)

  await expect(checkAndFix(directory)).resolves.toBe(false)
})
