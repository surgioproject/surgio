import os from 'node:os'
import path from 'node:path'
import fs from 'fs-extra'
import { afterEach, describe, expect, test } from 'vitest'

import { defineSurgioProject, env } from './core.js'
import { loadSurgioProject } from './node.js'

const directories: string[] = []
const testEnvironmentKey = 'SURGIO_PROJECT_TEST_ENV'

afterEach(async () => {
  delete process.env[testEnvironmentKey]
  await Promise.all(
    directories.splice(0).map((directory) => fs.remove(directory)),
  )
})

describe('project core', () => {
  test('reads an environment variable', () => {
    process.env[testEnvironmentKey] = 'value'
    expect(env(testEnvironmentKey)).toBe('value')
  })

  test('preserves an explicitly empty environment variable', () => {
    process.env[testEnvironmentKey] = ''
    expect(env(testEnvironmentKey)).toBe('')
  })

  test('reports a missing environment variable by name', () => {
    expect(() => env(testEnvironmentKey)).toThrow(
      `环境变量 ${testEnvironmentKey} 未设置`,
    )
  })

  test('validates the project shape', () => {
    expect(defineSurgioProject({ artifacts: [], providers: {} })).toEqual({
      artifacts: [],
      providers: {},
    })
  })
})

test('loads a TypeScript project and merges node options', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'surgio-project-'))
  directories.push(directory)
  await fs.ensureDir(path.join(directory, 'template'))
  await fs.writeFile(
    path.join(directory, 'surgio.project.ts'),
    `export default {
      artifacts: [{ name: 'demo.conf', provider: 'demo', template: 'demo' }],
      gateway: { auth: true, accessToken: 'resolved' },
      providers: { demo: { type: 'custom', nodeList: [] } },
      templateDir: './template'
    };
    const output: string = './output';
    export const nodeOptions = () => ({ output });
    `,
  )
  const project = await loadSurgioProject(directory)
  expect(project.source).toBe('project')
  expect(project.config.gateway?.accessToken).toBe('resolved')
  expect(project.config.output).toBe(path.join(directory, 'output'))
  expect(Object.keys(project.providers ?? {})).toEqual(['demo'])
})

test('keeps the ESM JavaScript project compatible', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'surgio-project-'))
  directories.push(directory)
  await fs.ensureDir(path.join(directory, 'template'))
  await fs.writeFile(
    path.join(directory, 'surgio.project.mjs'),
    'export default { artifacts: [], providers: {} }',
  )
  expect((await loadSurgioProject(directory)).source).toBe('project')
})

test('rejects multiple Project entries', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'surgio-project-'))
  directories.push(directory)
  await fs.writeFile(
    path.join(directory, 'surgio.project.ts'),
    'export default {}',
  )
  await fs.writeFile(
    path.join(directory, 'surgio.project.mjs'),
    'export default {}',
  )
  await expect(loadSurgioProject(directory)).rejects.toThrow(
    '多个 Surgio Project 入口',
  )
})

test('rejects ambiguous legacy and Project files', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'surgio-project-'))
  directories.push(directory)
  await fs.writeFile(
    path.join(directory, 'surgio.project.ts'),
    'export default {}',
  )
  await fs.writeFile(
    path.join(directory, 'surgio.conf.js'),
    'module.exports = {}',
  )
  await expect(loadSurgioProject(directory)).rejects.toThrow(
    '请只保留一个配置入口',
  )
})
