import { expect, test } from 'vitest'

import { buildRenderedArtifactCacheKey } from './cache-key.js'

import type { CacheKeyArtifact } from './cache-key.js'
import type { RenderArtifactOptions } from './public.js'

const artifact: CacheKeyArtifact = { name: 'clash.yaml', template: 'clash' }

const keyOf = (
  options: RenderArtifactOptions,
  target: CacheKeyArtifact = artifact,
): string => {
  const result = buildRenderedArtifactCacheKey('node-runtime', target, options)
  if (!result.cacheable) throw new Error(`预期可缓存，实际：${result.reason}`)
  return result.key
}

const reasonOf = (options: RenderArtifactOptions): string => {
  const result = buildRenderedArtifactCacheKey(
    'node-runtime',
    artifact,
    options,
  )
  if (result.cacheable) throw new Error('预期不可缓存')
  return result.reason
}

test('归一化请求头的大小写与顺序', () => {
  expect(
    keyOf({
      getNodeListParams: {
        requestHeaders: { 'X-Surge-Unlocked-Features': 'a', accept: '*/*' },
      },
    }),
  ).toBe(
    keyOf({
      getNodeListParams: {
        requestHeaders: { Accept: '*/*', 'x-surge-unlocked-features': 'a' },
      },
    }),
  )
})

test('归一化 downloadUrl 的 query 顺序', () => {
  expect(keyOf({ downloadUrl: 'https://example.com/x?a=1&b=2' })).toBe(
    keyOf({ downloadUrl: 'https://example.com/x?b=2&a=1' }),
  )
})

test('downloadUrl 不是合法 URL 时按原样参与 key', () => {
  expect(keyOf({ downloadUrl: 'not a url' })).not.toBe(
    keyOf({ downloadUrl: 'not a url either' }),
  )
})

test('未知的渲染参数导致不缓存', () => {
  expect(reasonOf({ customParams: { foo: 'bar' } })).toBe(
    'customParams.foo 的取值不可枚举',
  )
  expect(reasonOf({ getNodeListParams: { foo: 'bar' } })).toBe(
    'getNodeListParams.foo 的取值不可枚举',
  )
})

test('requestUserAgent 参与渲染时不缓存', () => {
  expect(
    reasonOf({ getNodeListParams: { requestUserAgent: 'Surge iOS/2920' } }),
  ).toBe('requestUserAgent 参与渲染，客户端 UA 基数不可枚举')
})

test('函数 filter 不缓存，避免两个不同函数命中同一个 key', () => {
  const first = () => true
  const second = () => false

  expect(reasonOf({ filter: first })).toBe(
    'filter 是函数，无法参与缓存 key 计算',
  )
  expect(reasonOf({ filter: second })).toBe(
    'filter 是函数，无法参与缓存 key 计算',
  )
})

test('模板不同的 renderProviders 请求不会互相命中', () => {
  const providersArtifact = { name: 'providers:demo' }

  expect(keyOf({}, { ...providersArtifact, template: 'a' })).not.toBe(
    keyOf({}, { ...providersArtifact, template: 'b' }),
  )
})

test('format 与命名 filter 参与 key', () => {
  expect(keyOf({ format: 'clash' })).not.toBe(keyOf({ format: 'surge' }))
  expect(keyOf({ filter: 'youtubeFilter' })).not.toBe(
    keyOf({ filter: 'netflixFilter' }),
  )
})

test('node 与 worker 使用同一份摘要，只有 scope 前缀不同', () => {
  const options: RenderArtifactOptions = {
    downloadUrl: 'https://example.com/get-artifact/clash.yaml?access_token=x',
    format: 'clash',
  }
  const node = buildRenderedArtifactCacheKey('node-runtime', artifact, options)
  const worker = buildRenderedArtifactCacheKey('worker', artifact, options)

  if (!node.cacheable || !worker.cacheable) throw new Error('预期可缓存')

  expect(node.key).toBe(`rendered-artifact:node-runtime:${node.key.slice(-32)}`)
  expect(worker.key).toBe(`rendered-artifact:worker:${node.key.slice(-32)}`)
})
