import nunjucks from 'nunjucks';
import { JsonObject } from 'type-fest';
import YAML from 'yaml';
import { toBase64 } from './utils';
import { CLASH_UNSUPPORTED_RULE, MELLOW_UNSUPPORTED_RULE, QUANTUMULT_X_UNSUPPORTED_RULE } from './utils/constant';

export default function getEngine(templateDir: string): nunjucks.Environment {
  const engine = nunjucks.configure(templateDir, {
    autoescape: false,
  });

  engine.addFilter('patchYamlArray', (str: string) => {
    const array = str.split('\n');

    return array
      .filter(item => {
        const testString: string = (!!item && item.trim() !== '') ? item.toUpperCase() : '';

        return testString !== '' &&
          CLASH_UNSUPPORTED_RULE.every(s => !testString.startsWith(s));
      })
      .map((item: string) => {
        if (item.startsWith('#')) {
          return item;
        }
        return `- ${item}`
          .replace(/,no-resolve/, '')
          .replace(/\/\/.*$/, '')
          .trim();
      })
      .join('\n');
  });

  engine.addFilter('quantumultx', (str: string) => {
    const array = str.split('\n');

    return array
      .filter(item => {
        const testString: string = (!!item && item.trim() !== '') ? item.toUpperCase() : '';

        return testString !== '' &&
          QUANTUMULT_X_UNSUPPORTED_RULE.every(s => !testString.startsWith(s));
      })
      .join('\n');
  });

  engine.addFilter('mellow', (str: string) => {
    const array = str.split('\n');

    return array
      .filter(item => {
        const testString: string = (!!item && item.trim() !== '') ? item.toUpperCase() : '';

        return testString !== '' &&
          MELLOW_UNSUPPORTED_RULE.every(s => !testString.startsWith(s));
      })
      .map((item: string) => {
        if (item.startsWith('#')) {
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
