import os from 'node:os'
import path from 'node:path'
import fs from 'fs-extra'
import { afterEach, describe, expect, test } from 'vitest'

import {
  SupportProviderEnum,
  type PossibleProviderConfigType,
} from '../types.js'

import {
  addArtifactToProjectSource,
  addProviderToProjectSource,
  SurgioProjectEditError,
  updateSurgioProjectFile,
} from './editor.js'

const temporaryDirectories: string[] = []

const makeTemporaryDirectory = async (): Promise<string> => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'surgio-project-'))
  temporaryDirectories.push(directory)
  return directory
}

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((dir) => fs.remove(dir)))
})

const clashProvider: PossibleProviderConfigType = {
  type: SupportProviderEnum.Clash,
  url: 'https://example.com/subscription?a=1&b=2',
  addFlag: true,
}

describe('Surgio Project editor', () => {
  test.each(['ts', 'mts', 'mjs', 'js'])(
    'updates a wrapped static Project in a .%s file',
    async (extension) => {
      const directory = await makeTemporaryDirectory()
      const filename = path.join(directory, `surgio.project.${extension}`)
      const source = [
        "import { defineSurgioProject } from 'surgio/project'",
        '',
        'export default defineSurgioProject({',
        '  artifacts: [],',
        '  providers: {},',
        '})',
        '',
      ].join('\n')
      await fs.writeFile(filename, source)

      await updateSurgioProjectFile(filename, (current) =>
        addProviderToProjectSource(current, 'demo-provider', clashProvider),
      )
      await updateSurgioProjectFile(filename, (current) =>
        addArtifactToProjectSource(current, {
          name: 'demo.conf',
          provider: 'demo-provider',
          template: 'demo',
        }),
      )

      const output = await fs.readFile(filename, 'utf8')
      expect(output).toContain("'demo-provider': {")
      expect(output).toContain(
        "url: 'https://example.com/subscription?a=1&b=2'",
      )
      expect(output).toContain("name: 'demo.conf'")
      expect(output.endsWith('\n')).toBe(true)
    },
  )

  test('updates a bare default export with top-level satisfies containers', () => {
    const source = [
      "import type { ArtifactConfigInput } from 'surgio/project'",
      '',
      'const artifacts = [] satisfies ArtifactConfigInput[]',
      'const providers = {}',
      '',
      'export default { artifacts, providers }',
      '',
    ].join('\n')

    const withProvider = addProviderToProjectSource(
      source,
      'demo',
      clashProvider,
    )
    const output = addArtifactToProjectSource(withProvider, {
      name: 'demo.json',
      provider: 'demo',
      template: 'demo',
      templateType: 'json',
      combineProviders: ['backup'],
    })

    expect(output).toContain('const providers = {')
    expect(output).toContain('demo: {')
    expect(output).toContain("templateType: 'json'")
    expect(output).toContain("combineProviders: ['backup']")
  })

  test('supports a top-level Project object and preserves CRLF', () => {
    const source = [
      'const project = {',
      '  artifacts: [],',
      '  providers: {},',
      '}',
      'export default defineSurgioProject(project)',
      '',
    ].join('\r\n')

    const output = addProviderToProjectSource(source, 'demo', clashProvider)

    expect(output).toContain('\r\n')
    expect(output.replace(/\r\n/g, '')).not.toContain('\n')
    expect(output.endsWith('\r\n')).toBe(true)
  })

  test('preserves double quotes, comments, and unrelated code around satisfies', () => {
    const source = [
      'const untouched = "keep" // preserve this comment',
      '',
      'export default defineSurgioProject({',
      '  artifacts: [],',
      '  providers: {},',
      '} satisfies SurgioProjectDefinition)',
      '',
    ].join('\n')

    const output = addProviderToProjectSource(source, 'demo', clashProvider)

    expect(output).toContain(
      'const untouched = "keep" // preserve this comment',
    )
    expect(output).toContain('type: "clash"')
    expect(output).toContain('} satisfies SurgioProjectDefinition)')
  })

  test('rejects duplicate Provider and Artifact names', () => {
    const source = `export default defineSurgioProject({
  artifacts: [{ name: 'demo.conf', provider: 'demo', template: 'demo' }],
  providers: { demo: { type: 'custom', nodeList: [] } },
})
`

    expect(() =>
      addProviderToProjectSource(source, 'demo', clashProvider),
    ).toThrow('Provider demo 已存在')
    expect(() =>
      addArtifactToProjectSource(source, {
        name: 'demo.conf',
        provider: 'demo',
        template: 'demo',
      }),
    ).toThrow('Artifact demo.conf 已存在')
  })

  test('rejects dynamic containers and provides a manual snippet', () => {
    const source = `export default defineSurgioProject({
  artifacts: getArtifacts(),
  providers: getProviders(),
})
`

    for (const edit of [
      () => addProviderToProjectSource(source, 'demo', clashProvider),
      () =>
        addArtifactToProjectSource(source, {
          name: 'demo.conf',
          provider: 'demo',
          template: 'demo',
        }),
    ]) {
      try {
        edit()
        expect.fail('Expected the Project edit to fail')
      } catch (error) {
        expect(error).toBeInstanceOf(SurgioProjectEditError)
        expect((error as SurgioProjectEditError).manualSnippet).toBeTruthy()
      }
    }
  })

  test('rejects a Project object with an ambiguous spread', () => {
    const source = `export default defineSurgioProject({
  artifacts: [],
  providers: {},
  ...dynamicProject,
})
`

    expect(() =>
      addProviderToProjectSource(source, 'demo', clashProvider),
    ).toThrow('无法安全定位静态 providers')
  })

  test('does not write a file when an edit fails', async () => {
    const directory = await makeTemporaryDirectory()
    const filename = path.join(directory, 'surgio.project.ts')
    const source = `export default defineSurgioProject({
  artifacts: [],
  providers: { ...dynamicProviders },
})
`
    await fs.writeFile(filename, source)

    await expect(
      updateSurgioProjectFile(filename, (current) =>
        addProviderToProjectSource(current, 'demo', clashProvider),
      ),
    ).rejects.toThrow('providers 包含无法静态分析的属性')
    await expect(fs.readFile(filename, 'utf8')).resolves.toBe(source)
  })
})
