import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, expect, test, vi } from 'vitest'

import { check } from './linter.js'

const directories: string[] = []

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
