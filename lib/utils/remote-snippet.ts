import Bluebird from 'bluebird';
import crypto from 'crypto';
import { logger } from '@surgio/logger';
import detectNewline from 'detect-newline';
import nunjucks from 'nunjucks';
import espree, { ExpressionStatementNode } from 'espree';

import { RemoteSnippet, RemoteSnippetConfig } from '../types';
import { NETWORK_CONCURRENCY, REMOTE_SNIPPET_CACHE_MAXAGE } from './constant';
import { ConfigCache } from './cache';
import httpClient from './http-client';
import { isNow } from './index';
import { createTmpFactory } from './tmp-helper';

export const parseMacro = (
  snippet: string,
): {
  functionName: string;
  arguments: string[];
} => {
  const regex = /{%\s?macro(.*)\s?%}/gm;
  const match = regex.exec(snippet);

  if (!match) {
    throw new Error('该片段不包含可用的宏');
  }

  const ast = espree.parse(match[1], { ecmaVersion: 6 });
  let statement: ExpressionStatementNode | undefined;

  for (const node of ast.body) {
    if (node.type === 'ExpressionStatement') {
      statement = node;
      break;
    }
  }

  if (
    !statement ||
    statement.expression.type !== 'CallExpression' ||
    statement.expression.callee.name !== 'main'
  ) {
    throw new Error('该片段不包含可用的宏');
  }

  return {
    functionName: statement.expression.callee.name,
    arguments: statement.expression.arguments.map((item) => item.name),
  };
};

export const addProxyToSurgeRuleSet = (
  str: string,
  proxyName?: string,
): string => {
  if (!proxyName) {
    throw new Error('必须为片段指定一个策略');
  }

  const eol = detectNewline(str) || '\n';

  return str
    .split(eol)
    .map((item) => {
      if (item.trim() === '' || item.startsWith('#') || item.startsWith('//')) {
        return item;
      }

      const rule = item.split(',');

      switch (rule[0].trim().toUpperCase()) {
        case 'URL-REGEX':
        case 'AND':
        case 'OR':
        case 'NOT':
          return `${item},${proxyName}`;
        case 'IP-CIDR':
        case 'IP-CIDR6':
        case 'GEOIP':
          rule.splice(2, 0, proxyName);
          return rule.join(',');
        default:
          if (
            rule[rule.length - 1].includes('#') ||
            rule[rule.length - 1].includes('//')
          ) {
            rule[rule.length - 1] = rule[rule.length - 1]
              .replace(/(#|\/\/)(.*)/, '')
              .trim();
          }
          return [...rule, proxyName].join(',');
      }
    })
    .join(eol);
};

export const renderSurgioSnippet = (str: string, args: string[]): string => {
  const macro = parseMacro(str);

  macro.arguments.forEach((key, index) => {
    if (typeof args[index] === 'undefined') {
      throw new Error('Surgio 片段参数不足，缺少 ' + key);
    } else if (typeof args[index] !== 'string') {
      throw new Error(`Surgio 片段参数 ${key} 不为字符串`);
    }
  });
  const template = [
    `${str}`,
    `{{ main(${args.map((item) => JSON.stringify(item)).join(',')}) }}`,
  ].join('\n');

  return nunjucks.renderString(template, {}).trim();
};

export const loadRemoteSnippetList = (
  remoteSnippetList: ReadonlyArray<RemoteSnippetConfig>,
  cacheSnippet = true,
): Promise<ReadonlyArray<RemoteSnippet>> => {
  const tmpFactory = createTmpFactory('remote-snippets');

  function load(url: string): Promise<string> {
    return httpClient
      .get(url)
      .then((data) => {
        logger.info(`远程片段下载成功: ${url}`);
        return data.body;
      })
      .catch((err) => {
        logger.error(`远程片段下载失败: ${url}`);
        throw err;
      });
  }

  return Bluebird.map(
    remoteSnippetList,
    (item) => {
      const fileMd5 = crypto.createHash('md5').update(item.url).digest('hex');
      const isSurgioSnippet = item.surgioSnippet;

      return (async () => {
        if (cacheSnippet || isNow()) {
          const tmp = tmpFactory(fileMd5, REMOTE_SNIPPET_CACHE_MAXAGE);
          const tmpContent = await tmp.getContent();
          let snippet: string;

          if (tmpContent) {
            snippet = tmpContent;
          } else {
            snippet = await load(item.url);
            await tmp.setContent(snippet);
          }

          return {
            main: (...args: string[]) =>
              isSurgioSnippet
                ? renderSurgioSnippet(snippet, args)
                : addProxyToSurgeRuleSet(snippet, args[0]),
            name: item.name,
            url: item.url,
            text: snippet, // 原始内容
          };
        } else {
          const snippet: string = ConfigCache.has(item.url)
            ? (ConfigCache.get(item.url) as string)
            : await load(item.url).then((res) => {
                ConfigCache.set(item.url, res, REMOTE_SNIPPET_CACHE_MAXAGE);
                return res;
              });

          return {
            main: (...args: string[]) =>
              isSurgioSnippet
                ? renderSurgioSnippet(snippet, args)
                : addProxyToSurgeRuleSet(snippet, args[0]),
            name: item.name,
            url: item.url,
            text: snippet, // 原始内容
          };
        }
      })();
    },
    {
      concurrency: NETWORK_CONCURRENCY,
    },
  );
};
