import nunjucks from 'nunjucks';
import { JsonObject } from 'type-fest';
import YAML from 'yaml';
import { URL } from 'url';

import { decodeStringList, toBase64 } from '../utils';
import {
  MELLOW_UNSUPPORTED_RULE,
  QUANTUMULT_X_SUPPORTED_RULE,
  CLASH_SUPPORTED_RULE,
} from '../utils/constant';

export function getEngine(templateDir: string): nunjucks.Environment {
  const engine = nunjucks.configure(templateDir, {
    autoescape: false,
  });

  const clashFilter = (str: string): string => {
    const array = str.split('\n');

    return array
      .map(item => {
        const testString: string = (!!item && item.trim() !== '') ? item.toUpperCase() : '';

        if (testString.startsWith('#') || testString === '') {
          return item;
        }

        const matched = testString.match(/^([\w-]+),/);

        if (
          matched &&
          CLASH_SUPPORTED_RULE.some(s => matched[1] === s)
        ) {
          // 过滤出支持的规则类型
          return `- ${item}`
            .replace(/\/\/.*$/, '')
            .trim();
        }

        return null;
      })
      .filter(item => !!item)
      .join('\n');
  };

  engine.addFilter('patchYamlArray', clashFilter);
  engine.addFilter('clash', clashFilter);

  engine.addFilter('quantumultx', (str: string) => {
    const array = str.split('\n');

    return array
      .map(item => {
        const testString: string = (!!item && item.trim() !== '') ? item.toUpperCase() : '';

        if (testString.startsWith('#') || testString === '') {
          return item;
        }

        // Surge Script 处理
        if (testString.startsWith('HTTP-RESPONSE')) {
          return convertSurgeScriptRuleToQuantumultXRewriteRule(item);
        }

        const matched = testString.match(/^([\w-]+),/);

        if (
          matched &&
          QUANTUMULT_X_SUPPORTED_RULE.some(s => matched[1] === s)
        ) {
          // 过滤出支持的规则类型
          return item;
        }

        return null;
      })
      .filter(item => !!item)
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

  // yaml
  engine.addFilter('yaml', (obj: JsonObject) => YAML.stringify(obj));

  // base64
  engine.addFilter('base64', (str: string) => toBase64(str));

  // json
  engine.addFilter('json', (obj: JsonObject) => JSON.stringify(obj));

  return engine;
};

export const convertSurgeScriptRuleToQuantumultXRewriteRule = (str: string): string => {
  const parts = str.split(' ');
  const result = [];

  switch (parts[0]) {
    case 'http-response':
      const params = decodeStringList(parts.splice(2).join('').split(','));
      const scriptPath = params['script-path'];

      // parts[1] => Effective URL Rule
      result.push(parts[1], 'url', 'script-response-body', scriptPath);

      return result.join(' ');

    default:
      return '';
  }

};
