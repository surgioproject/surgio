import path from 'path'
import fs from 'fs-extra'
import _ from 'lodash'

import { normalizeCommonConfig } from './config-normalize.js'
import { CommandConfig, CommandConfigBeforeNormalize } from './types.js'
import { SurgioConfigValidator } from './validators/index.js'
import { addFlagMap } from './utils/flag.js'
import { ensureConfigFolder } from './utils/index.js'
import { loadModuleSync } from './utils/module-loader.js'

let finalConfig: CommandConfig | null = null

const applyConfigSideEffects = (userConfig: CommandConfigBeforeNormalize) => {
  if (userConfig.flags) {
    Object.keys(userConfig.flags).forEach((emoji) => {
      const names = userConfig.flags?.[emoji]
      if (typeof names === 'string') {
        addFlagMap(names, emoji)
      } else if (_.isRegExp(names)) {
        addFlagMap(names, emoji)
      } else {
        names?.forEach((name) => addFlagMap(name, emoji))
      }
    })
  }
}

export const loadConfig = (
  cwd: string,
  override?: Partial<CommandConfig>,
): CommandConfig => {
  const absPath = path.join(cwd, 'surgio.conf.js')

  /* istanbul ignore next -- @preserve */
  if (!fs.existsSync(absPath)) {
    throw new Error(`配置文件 ${absPath} 不存在`)
  }

  const userConfig = validateConfig(
    _.cloneDeep(loadModuleSync<Partial<CommandConfig>>(absPath)),
  )

  applyConfigSideEffects(userConfig)

  if (override) {
    return {
      ...normalizeConfig(cwd, userConfig),
      ...override,
    }
  }

  finalConfig = normalizeConfig(cwd, userConfig)

  return finalConfig
}

export const getConfig = () => {
  /* istanbul ignore next -- @preserve */
  if (!finalConfig) {
    throw new Error('请先调用 loadConfig 方法')
  }

  return finalConfig
}

export const setLoadedConfig = (config: CommandConfig): CommandConfig => {
  finalConfig = config
  applyConfigSideEffects(config)
  return config
}

export const setConfig = <T extends keyof CommandConfig>(
  key: T,
  value: CommandConfig[T],
): CommandConfig => {
  /* istanbul ignore next -- @preserve */
  if (!finalConfig) {
    throw new Error('请先调用 loadConfig 方法')
  }

  if (_.isPlainObject(value)) {
    finalConfig[key] = {
      ...(finalConfig[key] as object),
      ...(value as object),
    } as CommandConfig[T]
  } else {
    finalConfig[key] = value
  }

  return finalConfig
}

export const normalizeConfig = (
  cwd: string,
  userConfig: Partial<CommandConfigBeforeNormalize>,
): CommandConfig => {
  const config = {
    ...normalizeCommonConfig(userConfig),
    output: path.join(cwd, './dist'),
    templateDir: path.join(cwd, './template'),
    providerDir: path.join(cwd, './provider'),
    configDir: ensureConfigFolder(),
    cache: userConfig.cache ?? { type: 'filesystem' },
  } as CommandConfig

  /* istanbul ignore next -- @preserve */
  if (!fs.existsSync(config.templateDir)) {
    throw new Error(`仓库内缺少 ${config.templateDir} 目录`)
  }
  /* istanbul ignore next -- @preserve */
  if (!fs.existsSync(config.providerDir)) {
    throw new Error(`仓库内缺少 ${config.providerDir} 目录`)
  }

  /* istanbul ignore next -- @preserve */
  if (config.gateway) {
    if (config.gateway.auth && !config.gateway.accessToken) {
      throw new Error('请检查 gateway.accessToken 配置')
    }
  }

  return config
}

export const normalizeProjectConfig = (
  cwd: string,
  userConfig: Partial<CommandConfigBeforeNormalize>,
  options: {
    readonly templateDir?: string
    readonly output?: string
    readonly cache?: CommandConfigBeforeNormalize['cache']
    readonly upload?: CommandConfigBeforeNormalize['upload']
  } = {},
): CommandConfig => {
  const validated = validateConfig({
    ...userConfig,
    ...(options.cache ? { cache: options.cache } : null),
    ...(options.upload ? { upload: options.upload } : null),
  })
  const resolveFromProject = (value: string): string =>
    path.isAbsolute(value) ? value : path.resolve(cwd, value)
  const config = {
    ...normalizeCommonConfig(validated),
    output: resolveFromProject(options.output ?? './dist'),
    templateDir: resolveFromProject(options.templateDir ?? './template'),
    providerDir: path.join(cwd, './provider'),
    configDir: ensureConfigFolder(),
    cache: validated.cache ?? { type: 'filesystem' },
  } as CommandConfig

  if (!fs.existsSync(config.templateDir)) {
    throw new Error(`仓库内缺少 ${config.templateDir} 目录`)
  }
  if (config.gateway?.auth && !config.gateway.accessToken) {
    throw new Error('请检查 gateway.accessToken 配置')
  }
  return setLoadedConfig(config)
}

export const validateConfig = (
  userConfig: Partial<CommandConfigBeforeNormalize>,
): CommandConfigBeforeNormalize => {
  const result = SurgioConfigValidator.safeParse(userConfig)

  /* istanbul ignore next -- @preserve */
  if (!result.success) {
    throw result.error
  }

  return result.data
}
