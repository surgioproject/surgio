import fs from 'fs-extra';
import _ from 'lodash';
import path from 'path';
import { URL } from 'url';

import redis from './redis';
import { CommandConfig, CommandConfigBeforeNormalize } from './types';
import { SurgioConfigValidator } from './validators';
import { addFlagMap } from './utils/flag';
import { ensureConfigFolder } from './utils';

let finalConfig: CommandConfig | null = null;

export const loadConfig = (
  cwd: string,
  override?: Partial<CommandConfig>,
): CommandConfig => {
  const absPath = path.join(cwd, 'surgio.conf.js');

  // istanbul ignore next
  if (!fs.existsSync(absPath)) {
    throw new Error(`配置文件 ${absPath} 不存在`);
  }

  const userConfig = validateConfig(_.cloneDeep(require(absPath)));

  if (userConfig.flags) {
    Object.keys(userConfig.flags).forEach((emoji) => {
      if (userConfig.flags) {
        if (typeof userConfig.flags[emoji] === 'string') {
          addFlagMap(userConfig.flags[emoji] as string, emoji);
        } else if (_.isRegExp(userConfig.flags[emoji])) {
          addFlagMap(userConfig.flags[emoji] as RegExp, emoji);
        } else {
          (userConfig.flags[emoji] as ReadonlyArray<string | RegExp>).forEach(
            (name) => {
              addFlagMap(name, emoji);
            },
          );
        }
      }
    });
  }

  if (override) {
    return {
      ...normalizeConfig(cwd, userConfig),
      ...override,
    };
  }

  finalConfig = normalizeConfig(cwd, userConfig);

  return finalConfig;
};

export const getConfig = () => {
  // istanbul ignore next
  if (!finalConfig) {
    throw new Error('请先调用 loadConfig 方法');
  }

  return finalConfig;
};

export const setConfig = <T extends keyof CommandConfig>(
  key: T,
  value: CommandConfig[T],
): CommandConfig => {
  // istanbul ignore next
  if (!finalConfig) {
    throw new Error('请先调用 loadConfig 方法');
  }

  if (_.isPlainObject(value)) {
    finalConfig[key] = {
      ...(finalConfig[key] as object),
      ...(value as object),
    } as CommandConfig[T];
  } else {
    finalConfig[key] = value;
  }

  return finalConfig;
};

export const normalizeConfig = (
  cwd: string,
  userConfig: Partial<CommandConfigBeforeNormalize>,
): CommandConfig => {
  const defaultConfig: Partial<CommandConfig> = {
    output: path.join(cwd, './dist'),
    templateDir: path.join(cwd, './template'),
    providerDir: path.join(cwd, './provider'),
    configDir: ensureConfigFolder(),
  };
  const config: CommandConfig = _.defaultsDeep(userConfig, defaultConfig);

  // istanbul ignore next
  if (!fs.existsSync(config.templateDir)) {
    throw new Error(`仓库内缺少 ${config.templateDir} 目录`);
  }
  // istanbul ignore next
  if (!fs.existsSync(config.providerDir)) {
    throw new Error(`仓库内缺少 ${config.providerDir} 目录`);
  }

  if (/http/i.test(config.urlBase)) {
    const urlObject = new URL(config.urlBase);
    config.publicUrl = urlObject.origin + '/';
  } else {
    config.publicUrl = '/';
  }

  // istanbul ignore next
  if (config.cache && config.cache.type === 'redis') {
    if (!config.cache.redisUrl) {
      throw new Error('缓存配置错误，请检查 cache.redisUrl 配置');
    }

    redis.createRedis(config.cache.redisUrl);
  }

  // istanbul ignore next
  if (config.gateway) {
    if (config.gateway.auth && !config.gateway.accessToken) {
      throw new Error('请检查 gateway.accessToken 配置');
    }
  }

  return config;
};

export const validateConfig = (
  userConfig: Partial<CommandConfig>,
): CommandConfigBeforeNormalize => {
  const result = SurgioConfigValidator.safeParse(userConfig);

  // istanbul ignore next
  if (!result.success) {
    throw result.error;
  }

  return result.data;
};
