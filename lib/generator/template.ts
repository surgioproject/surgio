import fs from 'fs-extra';
import nunjucks from 'nunjucks';
import path from "path";
import { JsonObject } from 'type-fest';
import YAML from 'yaml';

import { RemoteSnippet } from '../types';
import { decodeStringList, toBase64 } from '../utils';
import {
  MELLOW_UNSUPPORTED_RULE,
  QUANTUMULT_X_SUPPORTED_RULE,
  CLASH_SUPPORTED_RULE,
} from '../utils/constant';
import { addProxyToSurgeRuleSet } from '../utils/remote-snippet';

export function getEngine(templateDir: string): nunjucks.Environment {
  const engine = nunjucks.configure(templateDir, {
    autoescape: false,
  });

  const clashFilter = (str?: string): string => {
    // istanbul ignore next
    if (!str) {
      return '';
    }

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

  engine.addFilter('quantumultx', (str?: string): string => {
    // istanbul ignore next
    if (!str) {
      return '';
    }

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
        if (testString.startsWith('HTTP-REQUEST')) {
          return convertSurgeScriptRuleToQuantumultXRewriteRule(item);
        }
        if (/type\s?=\s?http-response/.test(item)) {
          return convertNewSurgeScriptRuleToQuantumultXRewriteRule(item);
        }
        if (/type\s?=\s?http-request/.test(item)) {
          return convertNewSurgeScriptRuleToQuantumultXRewriteRule(item);
        }

        const matched = testString.match(/^([\w-]+),/);

        if (
          matched &&
          QUANTUMULT_X_SUPPORTED_RULE.some(s => matched[1] === s)
        ) {
          if (matched[1] === 'IP-CIDR6') {
            return item.replace(/IP-CIDR6/i, 'IP6-CIDR');
          }

          // 过滤出支持的规则类型
          return item;
        }

        return null;
      })
      .filter(item => !!item)
      .join('\n');
  });

  engine.addFilter('mellow', (str?: string): string => {
    // istanbul ignore next
    if (!str) {
      return '';
    }

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
}

export const convertSurgeScriptRuleToQuantumultXRewriteRule = (str: string): string => {
  const parts = str.split(' ');
  const result: string[] = [];

  switch (parts[0]) {
    case 'http-response': {
      const params = decodeStringList(parts.splice(2).join('').split(','));
      const scriptPath = params['script-path'];
      const isRequireBody = 'requires-body' in params;

      if (isRequireBody) {
        // parts[1] => Effective URL Rule
        result.push(parts[1], 'url', 'script-response-body', scriptPath as string);
      } else {
        result.push(parts[1], 'url', 'script-response-header', scriptPath as string);
      }

      return result.join(' ');
    }
    case 'http-request': {
      const params = decodeStringList(parts.splice(2).join('').split(','));
      const scriptPath = params['script-path'];
      const isRequireBody = 'requires-body' in params;

      if (isRequireBody) {
        // parts[1] => Effective URL Rule
        result.push(parts[1], 'url', 'script-request-body', scriptPath as string);
      } else {
        result.push(parts[1], 'url', 'script-request-header', scriptPath as string);
      }

      return result.join(' ');
    }
    default:
      return '';
  }
};

export const convertNewSurgeScriptRuleToQuantumultXRewriteRule = (str: string): string => {
  const matched = str.match(/^(.+?)=(.+?)$/);
  const result: string[] = [];

  if (!matched) {
    return '';
  }

  const params = decodeStringList(matched[2].trim().split(','));

  switch (params.type) {
    case 'http-response': {
      const isRequireBody = 'requires-body' in params;

      if (isRequireBody) {
        result.push(params.pattern as string, 'url', 'script-response-body', params['script-path'] as string);
      } else {
        result.push(params.pattern as string, 'url', 'script-response-header', params['script-path'] as string);
      }

      return result.join(' ');
    }
    case 'http-request': {
      const isRequireBody = 'requires-body' in params;

      if (isRequireBody) {
        result.push(params.pattern as string, 'url', 'script-request-body', params['script-path'] as string);
      } else {
        result.push(params.pattern as string, 'url', 'script-request-header', params['script-path'] as string);
      }

      return result.join(' ');
    }
    default:
      return '';
  }
};

export const loadLocalSnippet = (cwd: string, relativeFilePath?: string): RemoteSnippet => {
  if (!relativeFilePath) {
    throw new Error('必须指定一个文件');
  }

  const absFilePath = path.join(cwd, relativeFilePath);
  const file = fs.readFileSync(absFilePath, { encoding: 'utf-8' });

  return {
    url: absFilePath,
    name: '',
    main: (rule: string) => addProxyToSurgeRuleSet(file, rule),
    text: file,
  };
}
