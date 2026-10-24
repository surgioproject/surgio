import os from 'node:os'
import path from 'node:path'
import fs from 'fs-extra'
import { afterEach, describe, expect, test } from 'vitest'

import { loadSurgioProject } from '../project/node.js'
import { SupportProviderEnum } from '../types.js'

import {
  createArtifact,
  createProvider,
  createTemplate,
  resolveNewTemplatePath,
  type NewGeneratorContext,
} from './new.js'

import type { SurgioProjectDefinition } from '../project/types.js'

const temporaryDirectories: string[] = []

const makeTemporaryDirectory = async (): Promise<string> => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'surgio-new-'))
  temporaryDirectories.push(directory)
  return directory
}

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((dir) => fs.remove(dir)))
})

const makeProject = (
  providers: SurgioProjectDefinition['providers'] = {},
  artifacts: SurgioProjectDefinition['artifacts'] = [],
  templateDir = 'template',
): SurgioProjectDefinition =>
  ({ artifacts, providers, templateDir }) as SurgioProjectDefinition

const makeContext = (
  projectDir: string,
  project: SurgioProjectDefinition,
  answers: Record<string, unknown>,
): NewGeneratorContext => ({
  project,
  projectDir,
  projectFile: path.join(projectDir, 'surgio.project.ts'),
  prompt: (async () => answers) as unknown as NewGeneratorContext['prompt'],
})

const writeProject = async (
  directory: string,
  source = `export default defineSurgioProject({
  artifacts: [],
  providers: {},
  templateDir: 'template',
})
`,
): Promise<void> => {
  await fs.writeFile(path.join(directory, 'surgio.project.ts'), source)
}

describe('surgio new provider', () => {
  test('adds a remote Provider with defaults and relay options', async () => {
    const directory = await makeTemporaryDirectory()
    await writeProject(directory)
    const context = makeContext(directory, makeProject(), {
      addFlag: true,
      enableRelay: true,
      name: 'remote',
      relayUrl: 'https://relay.example.com',
      type: SupportProviderEnum.Clash,
      udpRelay: true,
      url: 'https://example.com/subscription',
    })

    await expect(createProvider(context)).resolves.toContain('Provider remote')

    const output = await fs.readFile(context.projectFile, 'utf8')
    expect(output).toContain('remote: {')
    expect(output).toContain("type: 'clash'")
    expect(output).toContain("url: 'https://example.com/subscription'")
    expect(output).toContain('addFlag: true')
    expect(output).toContain('udpRelay: true')
    expect(output).toContain("relayUrl: 'https://relay.example.com'")
  })

  test('adds a custom Provider with an empty node list', async () => {
    const directory = await makeTemporaryDirectory()
    await writeProject(directory)
    const context = makeContext(directory, makeProject(), {
      name: 'local',
      type: SupportProviderEnum.Custom,
    })

    await createProvider(context)

    const output = await fs.readFile(context.projectFile, 'utf8')
    expect(output).toContain("type: 'custom'")
    expect(output).toContain('nodeList: []')
  })

  test('rejects invalid URLs and duplicate registry keys without writing', async () => {
    const directory = await makeTemporaryDirectory()
    await writeProject(directory)
    const filename = path.join(directory, 'surgio.project.ts')
    const original = await fs.readFile(filename, 'utf8')

    await expect(
      createProvider(
        makeContext(directory, makeProject(), {
          addFlag: true,
          enableRelay: false,
          name: 'remote',
          type: SupportProviderEnum.Clash,
          udpRelay: false,
          url: 'file:///tmp/provider',
        }),
      ),
    ).rejects.toThrow('HTTP 或 HTTPS URL')
    await expect(fs.readFile(filename, 'utf8')).resolves.toBe(original)

    await expect(
      createProvider(
        makeContext(
          directory,
          makeProject({
            remote: {
              nodeList: [],
              type: SupportProviderEnum.Custom,
            },
          }),
          { name: 'remote', type: SupportProviderEnum.Custom },
        ),
      ),
    ).rejects.toThrow('Provider remote 已存在')
    await expect(fs.readFile(filename, 'utf8')).resolves.toBe(original)
  })
})

describe('surgio new artifact', () => {
  test.each([
    ['nested/default.tpl', undefined],
    ['profiles/default.json', 'json'],
  ])('adds an Artifact for %s', async (template, templateType) => {
    const directory = await makeTemporaryDirectory()
    await writeProject(directory)
    await fs.outputFile(path.join(directory, 'template', template), '{}')
    const project = makeProject({
      backup: { nodeList: [], type: SupportProviderEnum.Custom },
      main: { nodeList: [], type: SupportProviderEnum.Custom },
    })
    const context = makeContext(directory, project, {
      combineProviders: ['backup'],
      name: 'output.conf',
      provider: 'main',
      template,
    })

    await createArtifact(context)

    const output = await fs.readFile(context.projectFile, 'utf8')
    expect(output).toContain("name: 'output.conf'")
    expect(output).toContain("provider: 'main'")
    expect(output).toContain(
      `template: '${template.replace(/\.(json|tpl)$/, '')}'`,
    )
    expect(output).toContain("combineProviders: ['backup']")
    if (templateType) expect(output).toContain("templateType: 'json'")
    else expect(output).not.toContain('templateType')
  })

  test('rejects duplicate Artifact names without writing', async () => {
    const directory = await makeTemporaryDirectory()
    await writeProject(directory)
    await fs.outputFile(path.join(directory, 'template', 'default.tpl'), '')
    const filename = path.join(directory, 'surgio.project.ts')
    const original = await fs.readFile(filename, 'utf8')
    const project = makeProject(
      { main: { nodeList: [], type: SupportProviderEnum.Custom } },
      [{ name: 'output.conf', provider: 'main', template: 'default' }],
    )

    await expect(
      createArtifact(
        makeContext(directory, project, {
          combineProviders: [],
          name: 'output.conf',
          provider: 'main',
          template: 'default.tpl',
        }),
      ),
    ).rejects.toThrow('Artifact output.conf 已存在')
    await expect(fs.readFile(filename, 'utf8')).resolves.toBe(original)
  })
})

describe('surgio new template', () => {
  test('creates an empty template in a safe relative subdirectory', async () => {
    const directory = await makeTemporaryDirectory()
    await writeProject(directory)
    const context = makeContext(directory, makeProject(), {
      name: 'rules/private',
    })

    await createTemplate(context)

    await expect(
      fs.readFile(path.join(directory, 'template/rules/private.tpl'), 'utf8'),
    ).resolves.toBe('')
  })

  test.each(['/tmp/escape', '../escape', 'nested/../../escape', 'C:\\escape'])(
    'rejects unsafe path %s',
    async (name) => {
      const directory = await makeTemporaryDirectory()
      const templateDir = path.join(directory, 'template')
      expect(() => resolveNewTemplatePath(templateDir, name)).toThrow()
    },
  )

  test('does not overwrite an existing template', async () => {
    const directory = await makeTemporaryDirectory()
    await writeProject(directory)
    const filename = path.join(directory, 'template/existing.tpl')
    await fs.outputFile(filename, 'keep me')

    await expect(
      createTemplate(
        makeContext(directory, makeProject(), { name: 'existing.tpl' }),
      ),
    ).rejects.toThrow('不会覆盖')
    await expect(fs.readFile(filename, 'utf8')).resolves.toBe('keep me')
  })
})

test('all three generators produce a reloadable, validated v4 Project', async () => {
  const directory = await makeTemporaryDirectory()
  await writeProject(
    directory,
    `export default {
  artifacts: [],
  providers: {},
  templateDir: 'template',
}
`,
  )

  await createTemplate(
    makeContext(directory, makeProject(), { name: 'generated' }),
  )
  await createProvider(
    makeContext(directory, makeProject(), {
      name: 'generated',
      type: SupportProviderEnum.Custom,
    }),
  )
  await createArtifact(
    makeContext(
      directory,
      makeProject({
        generated: { nodeList: [], type: SupportProviderEnum.Custom },
      }),
      {
        combineProviders: [],
        name: 'generated.conf',
        provider: 'generated',
        template: 'generated.tpl',
      },
    ),
  )

  const loaded = await loadSurgioProject(directory)
  expect(loaded.source).toBe('project')
  expect(loaded.definition?.providers).toHaveProperty('generated')
  expect(loaded.config.artifacts).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        name: 'generated.conf',
        provider: 'generated',
        template: 'generated',
      }),
    ]),
  )
})
