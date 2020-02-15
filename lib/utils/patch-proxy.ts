// istanbul ignore file

import Debug from 'debug';

const debug = Debug('surgio:utils:patch-proxy');
const keys: ReadonlyArray<string> = [
  'http_proxy',
  'https_proxy',
  'all_proxy',
];

process.env.GLOBAL_AGENT_ENVIRONMENT_VARIABLE_NAMESPACE = '';

keys.forEach(key => {
  if (key in process.env) {
    const newKey = key.toUpperCase();
    const value = process.env[key];

    debug('Patched environment variable %s=%s', newKey, value);
    process.env[newKey] = value;
  }
});
