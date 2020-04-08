import got from 'got';
import Bluebird from 'bluebird';
import crypto from 'crypto';
import { logger } from '@surgio/logger';

import { RemoteSnippet, RemoteSnippetConfig } from '../types';
import { NETWORK_CONCURRENCY, NETWORK_TIMEOUT, REMOTE_SNIPPET_CACHE_MAXAGE } from './constant';
import { ConfigCache } from './cache';
import { createTmpFactory } from './tmp-helper';

export const addProxyToSurgeRuleSet = (str: string, proxyName: string): string => {

  return str
    .split('\n')
    .map(item => {
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
            rule[rule.length - 1] = rule[rule.length - 1].replace(/(#|\/\/)(.*)/, '').trim();
          }
          return [...rule, proxyName].join(',');
      }
    })
    .join('\n');
};

export const loadRemoteSnippetList = (remoteSnippetList: ReadonlyArray<RemoteSnippetConfig>): Promise<ReadonlyArray<RemoteSnippet>> => {
  function load(url: string): Promise<string> {
    logger.info(`正在下载远程片段: ${url}`);

    return got.get(url, {
      timeout: NETWORK_TIMEOUT,
    })
      .then(data => {
        logger.info(`远程片段下载成功: ${url}`);
        return data.body;
      })
      .catch(err => {
        logger.error(`远程片段下载失败: ${url}`);
        throw err;
      });
  }

  return Bluebird.map(remoteSnippetList, item => {
    const tmpFactory = createTmpFactory('remote-snippets');
    const fileMd5 = crypto.createHash('md5').update(item.url).digest('hex');

    return (async () => {
      if (process.env.NOW_REGION) {
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
          main: (rule: string) => addProxyToSurgeRuleSet(snippet, rule),
          name: item.name,
          url: item.url,
          text: snippet, // 原始内容
        };
      } else {
        const snippet: string = ConfigCache.has(item.url)
          ? ConfigCache.get(item.url) as string
          : await load(item.url)
              .then(res => {
                ConfigCache.set(item.url, res, REMOTE_SNIPPET_CACHE_MAXAGE);
                return res;
              });

        return {
          main: (rule: string) => addProxyToSurgeRuleSet(snippet, rule),
          name: item.name,
          url: item.url,
          text: snippet, // 原始内容
        };
      }
    })();
  }, {
    concurrency: NETWORK_CONCURRENCY,
  });
};
