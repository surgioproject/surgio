import Joi from '@hapi/joi';
import fs from 'fs-extra';
import _ from 'lodash';
import path from 'path';
import { URL } from 'url';
import { deprecate } from 'util';
import { DEP005, DEP006 } from '../misc/deprecation';

import { CommandConfig } from '../types';
import { PROXY_TEST_INTERVAL, PROXY_TEST_URL } from './constant';
import { addFlagMap } from './flag';
import { ensureConfigFolder } from './index';

const showDEP005 = deprecate(_.noop, DEP005, 'DEP005');
const showDEP006 = deprecate(_.noop, DEP006, 'DEP006');

export const loadConfig = (
  cwd: string,
  configPath: string,
  override?: Partial<CommandConfig>,
): CommandConfig => {
  const absPath = path.resolve(cwd, configPath);

  if (!fs.existsSync(absPath)) {
    throw new Error(`配置文件 ${absPath} 不存在`);
  }

  const userConfig = _.cloneDeep(require(absPath));

  validateConfig(userConfig);

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

  return normalizeConfig(cwd, userConfig);
};

export const normalizeConfig = (
  cwd: string,
  userConfig: Partial<CommandConfig>,
): CommandConfig => {
  const defaultConfig: Partial<CommandConfig> = {
    artifacts: [],
    urlBase: '/',
    output: path.join(cwd, './dist'),
    templateDir: path.join(cwd, './template'),
    providerDir: path.join(cwd, './provider'),
    configDir: ensureConfigFolder(),
    surgeConfig: {
      shadowsocksFormat: 'ss',
      v2ray: 'native',
      resolveHostname: false,
    },
    clashConfig: {
      ssrFormat: 'native',
    },
    proxyTestUrl: PROXY_TEST_URL,
    proxyTestInterval: PROXY_TEST_INTERVAL,
    checkHostname: false,
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

  if (config.binPath && config.binPath.v2ray) {
    config.binPath.vmess = config.binPath.v2ray;
  }

  // istanbul ignore next
  if (config.surgeConfig?.shadowsocksFormat === 'custom') {
    showDEP005();
  }

  // istanbul ignore next
  if (config.surgeConfig?.v2ray === 'external') {
    showDEP006();
  }

  return config;
};

export const validateConfig = (userConfig: Partial<CommandConfig>): void => {
  const artifactSchema = Joi.object({
    name: Joi.string().required(),
    categories: Joi.array().items(Joi.string()),
    template: Joi.string().required(),
    provider: Joi.string().required(),
    combineProviders: Joi.array().items(Joi.string()),
    customParams: Joi.object(),
    proxyGroupModifier: Joi.function(),
    destDir: Joi.string(),
    downloadUrl: Joi.string(),
  }).unknown();
  const remoteSnippetSchema = Joi.object({
    url: Joi.string()
      .uri({
        scheme: [/https?/],
      })
      .required(),
    name: Joi.string().required(),
    surgioSnippet: Joi.boolean().strict(),
  });
  const schema = Joi.object({
    artifacts: Joi.array().items(artifactSchema).required(),
    remoteSnippets: Joi.array().items(remoteSnippetSchema),
    urlBase: Joi.string(),
    upload: Joi.object({
      prefix: Joi.string(),
      region: Joi.string(),
      endpoint: Joi.string(),
      bucket: Joi.string().required(),
      accessKeyId: Joi.string().required(),
      accessKeySecret: Joi.string().required(),
    }),
    binPath: Joi.object({
      shadowsocksr: Joi.string().pattern(/^\//),
      v2ray: Joi.string().pattern(/^\//),
      vmess: Joi.string().pattern(/^\//),
    }),
    flags: Joi.object().pattern(Joi.string(), [
      Joi.string(),
      Joi.object().regex(),
      Joi.array().items(Joi.string(), Joi.object().regex()),
    ]),
    surgeConfig: Joi.object({
      shadowsocksFormat: Joi.string().valid('ss', 'custom'),
      v2ray: Joi.string().valid('native', 'external'),
      resolveHostname: Joi.boolean().strict(),
    }).unknown(),
    quantumultXConfig: Joi.object({}).unknown(),
    clashConfig: Joi.object({
      ssrFormat: Joi.string().valid('native', 'legacy'),
    }).unknown(),
    analytics: Joi.boolean().strict(),
    gateway: Joi.object({
      accessToken: Joi.string(),
      auth: Joi.boolean().strict(),
      cookieMaxAge: Joi.number(),
      useCacheOnError: Joi.boolean().strict(),
    }).unknown(),
    proxyTestUrl: Joi.string().uri({
      scheme: [/https?/],
    }),
    proxyTestInterval: Joi.number(),
    customFilters: Joi.object().pattern(
      Joi.string(),
      Joi.any().allow(
        Joi.function(),
        Joi.object({
          filter: Joi.function(),
          supportSort: Joi.boolean().strict(),
        }),
      ),
    ),
    customParams: Joi.object(),
  }).unknown();

  const { error } = schema.validate(userConfig);

  // istanbul ignore next
  if (error) {
    throw error;
  }
};
