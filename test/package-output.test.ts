import { expect, test } from 'vitest'
import fs from 'fs-extra'
import path from 'path'

const projectRoot = path.resolve(__dirname, '..')

const listFiles = (directory: string): string[] =>
  fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name)

    return entry.isDirectory() ? listFiles(entryPath) : entryPath
  })

test('published CommonJS entrypoints can be required', () => {
  const entrypoints = [
    'index',
    'internal',
    'generator',
    'provider',
    'constant',
    'utils',
    'config',
  ]

  for (const entrypoint of entrypoints) {
    const exportedValue = require(path.join(projectRoot, entrypoint))

    expect(exportedValue).toBeTruthy()
  }
})

test('build emits only CommonJS package artifacts', () => {
  const sourceDirectory = path.join(projectRoot, 'src')
  const buildDirectory = path.join(projectRoot, 'build')
  const sourceFiles = listFiles(sourceDirectory)
    .filter((file) => file.endsWith('.ts') && !file.endsWith('.test.ts'))
    .map((file) => path.relative(sourceDirectory, file).replace(/\.ts$/, ''))
  const expectedFiles = sourceFiles.flatMap((file) => [
    `${file}.d.ts`,
    `${file}.js`,
    `${file}.js.map`,
  ])
  const emittedFiles = listFiles(buildDirectory).map((file) =>
    path.relative(buildDirectory, file),
  )

  expect(emittedFiles.sort()).toEqual(expectedFiles.sort())

  for (const file of emittedFiles.filter((file) => file.endsWith('.js'))) {
    const source = fs.readFileSync(path.join(buildDirectory, file), 'utf8')

    expect(source.startsWith('"use strict";')).toBe(true)
    expect(source).not.toMatch(/^\s*(?:import|export)\s/m)
  }
})
