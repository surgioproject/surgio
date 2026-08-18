import { expect, test } from 'vitest'
import fs from 'fs-extra'
import path from 'path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const projectRoot = fileURLToPath(new URL('..', import.meta.url))
const requireModule = createRequire(import.meta.url)

const listFiles = (directory: string): string[] =>
  fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name)

    return entry.isDirectory() ? listFiles(entryPath) : entryPath
  })

test('cache entrypoint does not eagerly load the Upstash client', async () => {
  const clientPaths = [requireModule.resolve('@upstash/redis')]

  for (const clientPath of clientPaths) {
    expect(requireModule.cache[clientPath]).toBeUndefined()
  }
  await import('surgio/cache')
  for (const clientPath of clientPaths) {
    expect(requireModule.cache[clientPath]).toBeUndefined()
  }
})

test('published entrypoints can be imported as ESM', async () => {
  const surgio = await import('surgio')

  expect(surgio).not.toHaveProperty('defineSurgioConfig')
  expect(surgio.utils).toBeTypeOf('object')
  expect(surgio.categories).toBeTypeOf('object')
})

test('published package metadata excludes Hygen templates and dependencies', () => {
  const manifest = fs.readJsonSync(path.join(projectRoot, 'package.json')) as {
    dependencies: Record<string, string>
    files: string[]
  }

  expect(manifest.files).not.toContain('hygen-template')
  expect(manifest.dependencies).not.toHaveProperty('@royli/hygen')
  expect(manifest.dependencies).toHaveProperty('magicast')
})

test('published ESM entrypoints can be required from CommonJS', () => {
  const entrypoints = [
    'surgio',
    'surgio/index.js',
    'surgio/internal',
    'surgio/generator',
    'surgio/provider',
    'surgio/constant',
    'surgio/utils',
    'surgio/config',
    'surgio/cache',
    'surgio/cache.js',
    'surgio/cache/core',
    'surgio/cache/cloudflare',
    'surgio/cache/filesystem',
    'surgio/cache/upstash',
    'surgio/worker',
    'surgio/worker/build',
    'surgio/worker/config',
    'surgio/build/provider/index',
  ]

  for (const entrypoint of entrypoints) {
    const exportedValue = requireModule(entrypoint)

    expect(exportedValue).toBeTruthy()
  }
})

test('build emits only ESM package artifacts', () => {
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

    expect(source.startsWith('"use strict";')).toBe(false)
    expect(source).not.toMatch(/\b(?:module\.exports|exports\.)/)
  }
})
