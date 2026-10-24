import path from 'node:path'
import { pathToFileURL } from 'node:url'
import fs from 'fs-extra'

import {
  loadConfig,
  normalizeProjectConfig,
  setLoadedConfig,
} from '../config.js'

import { defineSurgioProject } from './core.js'
import { resolveSurgioProjectFile } from './file.js'
import { projectToRuntimeProjection } from './internal.js'

import type { CommandConfig } from '../types.js'
import type {
  ProjectProviderDefinition,
  SurgioProjectDefinition,
  SurgioProjectModule,
} from './types.js'

export interface LoadSurgioProjectOptions {
  readonly override?: Partial<CommandConfig>
}

export interface LoadedSurgioProject {
  readonly config: CommandConfig
  readonly cwd: string
  readonly definition?: SurgioProjectDefinition
  readonly providers?: Readonly<Record<string, ProjectProviderDefinition>>
  readonly source: 'legacy' | 'project'
}

let loadedProject: LoadedSurgioProject | undefined

export const getLoadedSurgioProject = (): LoadedSurgioProject => {
  if (!loadedProject) throw new Error('请先调用 loadSurgioProject 方法')
  return loadedProject
}

export const loadSurgioProject = async (
  cwd: string,
  options: LoadSurgioProjectOptions = {},
): Promise<LoadedSurgioProject> => {
  const projectDir = path.resolve(cwd)
  const projectFile = resolveSurgioProjectFile(projectDir)
  const legacyFile = path.join(projectDir, 'surgio.conf.js')
  const hasProject = projectFile !== undefined
  const hasLegacy = await fs.pathExists(legacyFile)

  if (hasProject && hasLegacy) {
    throw new Error(
      `项目同时包含 ${projectFile} 和 ${legacyFile}，请只保留一个配置入口`,
    )
  }
  if (!hasProject) {
    const config = loadConfig(projectDir, options.override)
    loadedProject = { config, cwd: projectDir, source: 'legacy' }
    return loadedProject
  }

  const imported = (await import(
    `${pathToFileURL(projectFile).href}?surgio=${Date.now()}`
  )) as SurgioProjectModule
  const definition = defineSurgioProject(imported.default)
  const project = projectToRuntimeProjection(definition)
  const configInput =
    project.config as unknown as import('../types.js').CommandConfigBeforeNormalize
  const nodeOptions = ((await imported.nodeOptions?.()) ?? {}) as unknown as {
    readonly output?: string
    readonly cache?: import('../types.js').CommandConfigBeforeNormalize['cache']
    readonly upload?: import('../types.js').CommandConfigBeforeNormalize['upload']
  }
  const config = normalizeProjectConfig(projectDir, configInput, {
    templateDir: project.templateDir,
    output: nodeOptions.output,
    cache: nodeOptions.cache,
    upload: nodeOptions.upload,
  })
  const finalConfig = options.override
    ? setLoadedConfig({ ...config, ...options.override })
    : config
  loadedProject = {
    config: finalConfig,
    cwd: projectDir,
    definition,
    providers: project.providers,
    source: 'project',
  }
  return loadedProject
}
