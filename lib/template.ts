import nunjucks from 'nunjucks';
import { JsonObject } from 'type-fest';
import YAML from 'yaml';
import { URL } from 'url';

import { decodeStringList, toBase64 } from './utils';
import {
  CLASH_UNSUPPORTED_RULE,
  MELLOW_UNSUPPORTED_RULE,
  QUANTUMULT_X_SUPPORTED_RULE } from './utils/constant';

export default function getEngine(templateDir: string, publicUrl: string): nunjucks.Environment {
  const engine = nunjucks.configure(templateDir, {
    autoescape: false,
  });

  const clashFilter = (str: string): string => {
    const array = str.split('\n');

    return array
      .filter(item => {
        const testString: string = (!!item && item.trim() !== '') ? item.toUpperCase() : '';

        return CLASH_UNSUPPORTED_RULE.every(s => !testString.startsWith(s));
      })
      .map((item: string) => {
        if (item.startsWith('#') || item.trim() === '') {
          return item;
        }
        return `- ${item}`
          .replace(/,no-resolve/, '')
          .replace(/\/\/.*$/, '')
          .trim();
      })
      .join('\n');
  };

  engine.addFilter('patchYamlArray', clashFilter);
  engine.addFilter('clash', clashFilter);

  engine.addFilter('quantumultx', (str: string) => {
    const array = str.split('\n');

    return array
      .filter(item => {
        const testString: string = (!!item && item.trim() !== '') ? item.toUpperCase() : '';

        if (testString.startsWith('#') || testString === '') {
          return item;
        }

        // 过滤出支持的规则类型
        return QUANTUMULT_X_SUPPORTED_RULE.some(s => testString.startsWith(s));
      })
      .map((item: string) => {
        if (item.startsWith('http-response')) {
          return convertSurgeScriptRuleToQuantumultXRewriteRule(item, publicUrl);
        }
        return item;
      })
      .join('\n');
  });

  engine.addFilter('mellow', (str: string) => {
    const array = str.split('\n');

    return array
      .filter(item => {
        const testString: string = (!!item && item.trim() !== '') ? item.toUpperCase() : '';

        return MELLOW_UNSUPPORTED_RULE.every(s => !testString.startsWith(s));
      })
      .map((item: string) => {
        if (item.startsWith('#') || str.trim() === '') {
          return item;
        }
        return item
          .replace(/,no-resolve/, '')
          .replace(/\/\/.*$/, '')
          .trim();
      })
      .join('\n');
  });

  // istanbul ignore next
  engine.addFilter('yaml', (obj: JsonObject) => YAML.stringify(obj));

  engine.addFilter('base64', (str: string) => toBase64(str));

  return engine;
};

export const convertSurgeScriptRuleToQuantumultXRewriteRule = (str: string, publicUrl: string): string => {
  const parts = str.split(' ');
  const result = [];

  switch (parts[0]) {
    case 'http-response':
      const params = decodeStringList(parts.splice(2).join('').split(','));
      const scriptPath = params['script-path'];
      const apiEndpoint = new URL(publicUrl);
      apiEndpoint.pathname = '/qx-script';
      apiEndpoint.searchParams.set('url', `${scriptPath}`);

      // parts[1] => Effective URL Rule
      result.push(parts[1], 'url', 'script-response-body', apiEndpoint.toString());

      return result.join(' ');

    default:
      return '';
  }

};
