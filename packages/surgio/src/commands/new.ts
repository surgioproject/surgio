import path from 'node:path'
import { Args } from '@oclif/core'
import fs from 'fs-extra'
import inquirer from 'inquirer'

import BaseCommand from '../base-command.js'
import {
  addArtifactToProjectSource,
  addProviderToProjectSource,
  updateSurgioProjectFile,
} from '../project/editor.js'
import { resolveSurgioProjectFile } from '../project/file.js'
import {
  SupportProviderEnum,
  type ArtifactConfigInput,
  type PossibleProviderConfigType,
} from '../types.js'

import type { SurgioProjectDefinition } from '../project/types.js'

type Prompt = typeof inquirer.prompt

export interface NewGeneratorContext {
  project: SurgioProjectDefinition
  projectDir: string
  projectFile: string
  prompt: Prompt
}

interface ProviderAnswers {
  addFlag: boolean
  enableRelay: boolean
  name: string
  relayUrl?: string
  type: SupportProviderEnum
  udpRelay: boolean
  url?: string
}

interface ArtifactAnswers {
  combineProviders: string[]
  name: string
  provider: string
  template: string
}

interface TemplateAnswers {
  name: string
}

const nonEmpty = (value: string): true | string =>
  value.trim().length > 0 || '请输入非空名称'

const httpUrl = (value: string): true | string => {
  try {
    const url = new URL(value)
    return ['http:', 'https:'].includes(url.protocol)
      ? true
      : '请输入 HTTP 或 HTTPS URL'
  } catch {
    return '请输入有效的 HTTP 或 HTTPS URL'
  }
}

const isRemoteProvider = (type: SupportProviderEnum): boolean =>
  type !== SupportProviderEnum.Custom

const listTemplateFiles = async (
  directory: string,
  root = directory,
): Promise<string[]> => {
  if (!(await fs.pathExists(directory))) return []
  const entries = await fs.readdir(directory, { withFileTypes: true })
  const files = await Promise.all(
    entries.map(async (entry) => {
      const filename = path.join(directory, entry.name)
      if (entry.isDirectory()) return listTemplateFiles(filename, root)
      if (
        !entry.isFile() ||
        !['.json', '.tpl'].includes(path.extname(entry.name))
      ) {
        return []
      }
      return [path.relative(root, filename).split(path.sep).join('/')]
    }),
  )
  return files.flat().sort((left, right) => left.localeCompare(right))
}

export const resolveNewTemplatePath = (
  templateDir: string,
  input: string,
): string => {
  const name = input.trim()
  if (
    name.length === 0 ||
    name.includes('\0') ||
    path.isAbsolute(name) ||
    path.win32.isAbsolute(name)
  ) {
    throw new Error('模板名称必须是 templateDir 下的安全相对路径')
  }

  const normalized = name.replaceAll('\\', '/')
  const segments = normalized.split('/')
  if (segments.some((segment) => segment === '..' || segment === '')) {
    throw new Error('模板名称不能包含空目录或 .. 路径穿越')
  }

  const relativeName = normalized.endsWith('.tpl')
    ? normalized
    : `${normalized}.tpl`
  const root = path.resolve(templateDir)
  const filename = path.resolve(root, ...relativeName.split('/'))
  if (filename !== root && !filename.startsWith(`${root}${path.sep}`)) {
    throw new Error('模板路径超出 templateDir')
  }
  return filename
}

export const createProvider = async (
  context: NewGeneratorContext,
): Promise<string> => {
  const answers = await context.prompt<ProviderAnswers>([
    {
      choices: Object.values(SupportProviderEnum),
      message: 'Provider 类型',
      name: 'type',
      type: 'select',
    },
    {
      message: 'Provider 名称',
      name: 'name',
      required: true,
      type: 'input',
      validate: nonEmpty,
    },
    {
      message: '订阅 URL',
      name: 'url',
      required: true,
      type: 'input',
      validate: httpUrl,
      when: (current: Partial<ProviderAnswers>) =>
        current.type !== undefined && isRemoteProvider(current.type),
    },
    {
      default: true,
      message: '自动添加国旗标识',
      name: 'addFlag',
      type: 'confirm',
      when: (current: Partial<ProviderAnswers>) =>
        current.type !== undefined && isRemoteProvider(current.type),
    },
    {
      default: false,
      message: '启用 UDP Relay',
      name: 'udpRelay',
      type: 'confirm',
      when: (current: Partial<ProviderAnswers>) =>
        current.type !== undefined && isRemoteProvider(current.type),
    },
    {
      default: false,
      message: '配置 Relay URL',
      name: 'enableRelay',
      type: 'confirm',
      when: (current: Partial<ProviderAnswers>) =>
        current.type !== undefined && isRemoteProvider(current.type),
    },
    {
      message: 'Relay URL',
      name: 'relayUrl',
      required: true,
      type: 'input',
      validate: httpUrl,
      when: (current: Partial<ProviderAnswers>) => current.enableRelay === true,
    },
  ])

  const name = answers.name.trim()
  if (Object.hasOwn(context.project.providers, name)) {
    throw new Error(`Provider ${name} 已存在，Project 未被修改`)
  }
  if (isRemoteProvider(answers.type)) {
    const urlValidation = httpUrl(answers.url ?? '')
    if (urlValidation !== true) throw new Error(urlValidation)
    if (answers.enableRelay) {
      const relayValidation = httpUrl(answers.relayUrl ?? '')
      if (relayValidation !== true) throw new Error(relayValidation)
    }
  }

  const definition: PossibleProviderConfigType =
    answers.type === SupportProviderEnum.Custom
      ? {
          nodeList: [],
          type: SupportProviderEnum.Custom,
        }
      : {
          ...(answers.addFlag ? { addFlag: true } : {}),
          ...(answers.enableRelay ? { relayUrl: answers.relayUrl } : {}),
          type: answers.type,
          ...(answers.udpRelay ? { udpRelay: true } : {}),
          url: answers.url!,
        }

  await updateSurgioProjectFile(context.projectFile, (source) =>
    addProviderToProjectSource(source, name, definition),
  )
  return `Provider ${name} 已添加到 ${path.basename(context.projectFile)}`
}

export const createArtifact = async (
  context: NewGeneratorContext,
): Promise<string> => {
  const providerNames = Object.keys(context.project.providers).sort(
    (left, right) => left.localeCompare(right),
  )
  if (providerNames.length === 0) {
    throw new Error(
      'Project 中没有可用的 Provider，请先运行 surgio new provider',
    )
  }

  const templateDir = path.resolve(
    context.projectDir,
    context.project.templateDir ?? 'template',
  )
  const templates = await listTemplateFiles(templateDir)
  if (templates.length === 0) {
    throw new Error(`templateDir 中没有 .tpl 或 .json 模板：${templateDir}`)
  }

  const answers = await context.prompt<ArtifactAnswers>([
    {
      message: 'Artifact 名称',
      name: 'name',
      required: true,
      type: 'input',
      validate: nonEmpty,
    },
    {
      choices: providerNames,
      message: '主 Provider',
      name: 'provider',
      type: 'select',
    },
    {
      choices: templates,
      message: '模板',
      name: 'template',
      type: 'select',
    },
    {
      choices: (current: Partial<ArtifactAnswers>) =>
        providerNames.filter((name) => name !== current.provider),
      message: '额外合并的 Provider',
      name: 'combineProviders',
      type: 'checkbox',
    },
  ])

  const name = answers.name.trim()
  if (context.project.artifacts.some((artifact) => artifact.name === name)) {
    throw new Error(`Artifact ${name} 已存在，Project 未被修改`)
  }

  const extension = path.extname(answers.template)
  const artifact: ArtifactConfigInput = {
    ...(answers.combineProviders.length > 0
      ? { combineProviders: answers.combineProviders }
      : {}),
    name,
    provider: answers.provider,
    template: answers.template.slice(0, -extension.length),
    ...(extension === '.json' ? { templateType: 'json' as const } : {}),
  }

  await updateSurgioProjectFile(context.projectFile, (source) =>
    addArtifactToProjectSource(source, artifact),
  )
  return `Artifact ${name} 已添加到 ${path.basename(context.projectFile)}`
}

export const createTemplate = async (
  context: NewGeneratorContext,
): Promise<string> => {
  const answers = await context.prompt<TemplateAnswers>([
    {
      message: '模板名称（可包含相对子目录）',
      name: 'name',
      required: true,
      type: 'input',
      validate: nonEmpty,
    },
  ])
  const templateDir = path.resolve(
    context.projectDir,
    context.project.templateDir ?? 'template',
  )
  const filename = resolveNewTemplatePath(templateDir, answers.name)
  await fs.ensureDir(templateDir)
  await fs.ensureDir(path.dirname(filename))
  const [realTemplateDir, realParentDir] = await Promise.all([
    fs.realpath(templateDir),
    fs.realpath(path.dirname(filename)),
  ])
  if (
    realParentDir !== realTemplateDir &&
    !realParentDir.startsWith(`${realTemplateDir}${path.sep}`)
  ) {
    throw new Error('模板路径通过符号链接超出 templateDir')
  }
  try {
    await fs.writeFile(filename, '', { flag: 'wx' })
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'EEXIST') {
      throw new Error(`模板已存在，不会覆盖：${filename}`, { cause: error })
    }
    throw error
  }
  return `模板已创建：${path.relative(context.projectDir, filename)}`
}

class NewCommand extends BaseCommand<typeof NewCommand> {
  static description = '新建文件助手（仅支持 Surgio Project）'

  public async run(): Promise<void> {
    if (
      this.surgioProject.source !== 'project' ||
      !this.surgioProject.definition
    ) {
      throw new Error(
        '`surgio new` 仅支持 v4 surgio.project.*；请先将 legacy surgio.conf.js 项目迁移为 Surgio Project',
      )
    }

    const projectFile = resolveSurgioProjectFile(this.projectDir)
    if (!projectFile) {
      throw new Error('无法定位 surgio.project.ts、.mts、.mjs 或 .js')
    }

    const context: NewGeneratorContext = {
      project: this.surgioProject.definition,
      projectDir: this.projectDir,
      projectFile,
      prompt: inquirer.prompt,
    }
    const result =
      this.args.type === 'provider'
        ? await createProvider(context)
        : this.args.type === 'artifact'
          ? await createArtifact(context)
          : await createTemplate(context)
    this.log(result)
    await this.cleanup()
  }
}

NewCommand.args = {
  type: Args.custom({
    description: '文件类型',
    required: true,
    options: ['provider', 'template', 'artifact'],
  })(),
}

export default NewCommand
