import Joi from '@hapi/joi';
import fs from 'fs-extra';
import _ from 'lodash';
import path from 'path';

import { CommandConfig } from '../types';
import { ensureConfigFolder } from './index';

export const normalizeConfig = (cwd: string, userConfig: Partial<CommandConfig>): CommandConfig => {
  const defaultConfig: Partial<CommandConfig> = {
    artifacts: [],
    urlBase: '/',
    output: path.join(cwd, './dist'),
    templateDir: path.join(cwd, './template'),
    providerDir: path.join(cwd, './provider'),
    configDir: ensureConfigFolder(),
    surgeConfig: {
      v2ray: 'external',
    },
  };
  const config: CommandConfig = _.defaultsDeep(userConfig, defaultConfig);

  // istanbul ignore next
  if (!fs.existsSync(config.templateDir)) {
    throw new Error(`You must create ${config.templateDir} first.`);
  }
  // istanbul ignore next
  if (!fs.existsSync(config.providerDir)) {
    throw new Error(`You must create ${config.providerDir} first.`);
  }

  return config;
};

export const validateConfig = (userConfig: Partial<CommandConfig>): void => {
  const artifactSchema = Joi.object({
    name: Joi.string().required(),
    template: Joi.string().required(),
    provider: Joi.string().required(),
    combineProviders: Joi.array().items(Joi.string()),
    customParams: Joi.object(),
    proxyGroupModifier: Joi.function(),
  });
  const remoteSnippetSchema = Joi.object({
    url: Joi.string().uri({
      scheme: [
        /https?/,
      ],
    }).required(),
    name: Joi.string().required(),
  });
  const schema = Joi.object({
    artifacts: Joi.array().items(artifactSchema).required(),
    remoteSnippets: Joi.array().items(remoteSnippetSchema),
    urlBase: Joi.string(),
    upload: Joi.object({
      prefix: Joi.string(),
      region: Joi.string(),
      bucket: Joi.string().required(),
      accessKeyId: Joi.string().required(),
      accessKeySecret: Joi.string().required(),
    }),
    binPath: Joi.object({
      shadowsocksr: Joi.string().pattern(/^\//),
      v2ray: Joi.string().pattern(/^\//),
      vmess: Joi.string().pattern(/^\//),
    }),
    surgeConfig: Joi.object({
      v2ray: Joi.string().valid('native', 'external')
    }),
    analytics: Joi.boolean(),
  })
    .unknown();

  const { error } = schema.validate(userConfig);

  if (error) {
    throw error;
  }
};
