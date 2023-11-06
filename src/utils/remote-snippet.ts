import Bluebird from 'bluebird'
import { logger } from '@surgio/logger'
import detectNewline from 'detect-newline'
import ms from 'ms'
import nunjucks from 'nunjucks'
import * as babelParser from '@babel/parser'

import { CACHE_KEYS } from '../constant'
import { RemoteSnippet, RemoteSnippetConfig } from '../types'
import { unifiedCache } from './cache'
import { getNetworkConcurrency, getRemoteSnippetCacheMaxage } from './env-flag'
import httpClient from './http-client'
import { toMD5 } from './index'
import { createTmpFactory } from './tmp-helper'

export const parseMacro = (
  snippet: string,
): {
  functionName: string
  arguments: string[]
} => {
  const regex = /{%\s?macro(.*)\s?%}/gm
  const match = regex.exec(snippet)

  if (!match) {
    throw new Error('该片段不包含可用的宏')
  }

  const ast = babelParser.parse(match[1], {})
  let statement

  if (ast.errors.length) {
    throw new Error('该片段不包含可用的宏')
  }

  for (const node of ast.program.body) {
    if (node.type === 'ExpressionStatement') {
      statement = node
      break
    }
  }

  if (
    statement &&
    statement.expression.type === 'CallExpression' &&
    'name' in statement.expression.callee &&
    statement.expression.callee.name === 'main'
  ) {
    return {
      functionName: statement.expression.callee.name,
      arguments: statement.expression.arguments.map((item) => {
        if (item.type === 'Identifier') {
          return item.name
        } else {
          throw new Error('该片段不包含可用的宏')
        }
      }),
    }
  }

  throw new Error('该片段不包含可用的宏')
}

export const addProxyToSurgeRuleSet = (
  str: string,
  proxyName?: string,
): string => {
  if (!proxyName) {
    throw new Error('必须为片段指定一个策略')
  }

  const eol = detectNewline(str) || '\n'

  return str
    .split(eol)
    .map((item) => {
      if (item.trim() === '' || item.startsWith('#') || item.startsWith('//')) {
        return item
      }

      const rule = item.split(',')

      switch (rule[0].trim().toUpperCase()) {
        case 'URL-REGEX':
        case 'AND':
        case 'OR':
        case 'NOT':
          return `${item},${proxyName}`
        case 'IP-CIDR':
        case 'IP-CIDR6':
        case 'IP-ASN':
        case 'GEOIP':
          rule.splice(2, 0, proxyName)
          return rule.join(',')
        default:
          if (
            rule[rule.length - 1].includes('#') ||
            rule[rule.length - 1].includes('//')
          ) {
            rule[rule.length - 1] = rule[rule.length - 1]
              .replace(/(#|\/\/)(.*)/, '')
              .trim()
          }
          return [...rule, proxyName].join(',')
      }
    })
    .join(eol)
}

export const renderSurgioSnippet = (str: string, args: string[]): string => {
  const macro = parseMacro(str)

  macro.arguments.forEach((key, index) => {
    if (typeof args[index] === 'undefined') {
      throw new Error('Surgio 片段参数不足，缺少 ' + key)
    } else if (typeof args[index] !== 'string') {
      throw new Error(`Surgio 片段参数 ${key} 不为字符串`)
    }
  })
  const template = [
    `${str}`,
    `{{ main(${args.map((item) => JSON.stringify(item)).join(',')}) }}`,
  ].join('\n')

  return nunjucks.renderString(template, {}).trim()
}

export const loadRemoteSnippetList = async (
  remoteSnippetList: ReadonlyArray<RemoteSnippetConfig>,
  cacheSnippet = true,
): Promise<ReadonlyArray<RemoteSnippet>> => {
  const cacheType = await unifiedCache.getType()
  const useLocalFile = cacheSnippet && cacheType === 'default'

  function load(url: string): Promise<string> {
    return httpClient
      .get(url)
      .then((data) => {
        logger.info(`远程片段下载成功: ${url}`)
        return data.body
      })
      .catch((err) => {
        logger.error(`远程片段下载失败: ${url}`)
        throw err
      })
  }

  return Bluebird.map(
    remoteSnippetList,
    async (item) => {
      const fileMd5 = toMD5(item.url)
      const isSurgioSnippet = item.surgioSnippet

      if (useLocalFile) {
        const tmpFactory = createTmpFactory(
          CACHE_KEYS.RemoteSnippets,
          'default',
        )
        const tmp = tmpFactory(fileMd5, getRemoteSnippetCacheMaxage())
        const tmpContent = await tmp.getContent()
        let snippet: string

        if (tmpContent) {
          snippet = tmpContent
        } else {
          snippet = await load(item.url)
          await tmp.setContent(snippet)
        }

        return {
          main: (...args: string[]) =>
            isSurgioSnippet
              ? renderSurgioSnippet(snippet, args)
              : addProxyToSurgeRuleSet(snippet, args[0]),
          name: item.name,
          url: item.url,
          text: snippet, // 原始内容
        }
      } else {
        const cacheKey = `${CACHE_KEYS.RemoteSnippets}:${fileMd5}`
        const cachedSnippet = await unifiedCache.get<string>(cacheKey)
        const snippet: string = cachedSnippet
          ? cachedSnippet
          : await load(item.url)
              .then((res) => {
                return Promise.all([
                  unifiedCache.set(
                    cacheKey,
                    res,
                    cacheSnippet ? getRemoteSnippetCacheMaxage() : ms('1m'),
                  ),
                  res,
                ])
              })
              .then(([, res]) => res)

        return {
          main: (...args: string[]) =>
            isSurgioSnippet
              ? renderSurgioSnippet(snippet, args)
              : addProxyToSurgeRuleSet(snippet, args[0]),
          name: item.name,
          url: item.url,
          text: snippet, // 原始内容
        }
      }
    },
    {
      concurrency: getNetworkConcurrency(),
    },
  )
}
