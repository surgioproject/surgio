import nunjucks from 'nunjucks';
import { JsonObject } from 'type-fest';
import YAML from 'yaml';
import { toBase64 } from './utils';

export default function getEngine(templateDir: string): nunjucks.Environment {
  const engine = nunjucks.configure(templateDir, {
    autoescape: false,
  });

  engine.addFilter('patchYamlArray', (str: string) => {
    const array = str.split('\n');

    return array
      .filter(item => {
        return item && item.trim() !== '' &&
          item.indexOf('USER-AGENT') === -1 &&
          item.indexOf('PROCESS-NAME') === -1;
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

  // istanbul ignore next
  engine.addFilter('yaml', (obj: JsonObject) => YAML.stringify(obj));

  engine.addFilter('base64', (str: string) => toBase64(str));

  return engine;
};
