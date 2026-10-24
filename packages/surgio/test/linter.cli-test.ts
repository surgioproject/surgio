import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { execa } from 'execa'
import { afterEach, expect, test } from 'vitest'

const directories: string[] = []
const binPath = path.join(process.cwd(), 'bin/run')

afterEach(async () => {
  await Promise.all(
    directories
      .splice(0)
      .map((directory) => rm(directory, { force: true, recursive: true })),
  )
})

test('lint CLI reports failure, fixes TypeScript, and reports success', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'surgio-lint-cli-'))
  directories.push(directory)
  await mkdir(path.join(directory, 'template'))
  await writeFile(
    path.join(directory, 'surgio.project.mjs'),
    'export default { artifacts: [], providers: {} }',
  )
  const helperPath = path.join(directory, 'helper.ts')
  await writeFile(
    helperPath,
    "import { Stats } from 'node:fs'; export const stat: Stats | undefined = undefined",
  )
  const runLint = (...args: string[]) =>
    execa(
      process.execPath,
      [binPath, 'lint', '--project', directory, ...args],
      { reject: false, env: { NO_UPDATE_NOTIFIER: '1' } },
    )

  const before = await runLint()
  expect(before.exitCode).toBe(1)
  expect(before.stdout, before.stderr).toContain('consistent-type-imports')
  const fixed = await runLint('--fix')
  expect(fixed.exitCode).toBe(0)
  expect(await readFile(helperPath, 'utf8')).toContain('import type { Stats }')
  expect((await runLint()).exitCode).toBe(0)

  await writeFile(
    path.join(directory, 'broken.js'),
    'export default missingName',
  )
  const remaining = await runLint('--fix')
  expect(remaining.exitCode).toBe(1)
  expect(remaining.stdout).toContain('no-undef')
})
