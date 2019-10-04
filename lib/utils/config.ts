import fs from 'fs-extra';
import _ from 'lodash';
import path from 'path';

import { CommandConfig } from '../types';
import { ensureConfigFolder } from './index';

export const normalizeConfig = (cwd: string, obj: Partial<CommandConfig>): CommandConfig => {
  const defaultConfig: Partial<CommandConfig> = {
    artifacts: [],
    urlBase: '/',
    output: path.join(cwd, './dist'),
    templateDir: path.join(cwd, './template'),
    providerDir: path.join(cwd, './provider'),
    configDir: ensureConfigFolder(),
    upload: {
      region: 'oss-cn-hangzhou',
      prefix: '/',
    },
    surgeConfig: {
      v2ray: 'external',
    },
  };
  const config: CommandConfig = _.defaultsDeep(obj, defaultConfig);

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
