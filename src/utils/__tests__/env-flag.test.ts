import { afterEach, describe, expect, test, vi } from 'vitest'

import { getRenderedArtifactCacheMaxage } from '../env-flag.js'

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('getRenderedArtifactCacheMaxage', () => {
  test('默认与 Provider 缓存时长一致', () => {
    expect(getRenderedArtifactCacheMaxage()).toBe(10 * 60_000)

    vi.stubEnv('SURGIO_PROVIDER_CACHE_MAXAGE', '60000')
    expect(getRenderedArtifactCacheMaxage()).toBe(60_000)
  })

  test('优先使用 SURGIO_RENDERED_ARTIFACT_CACHE_MAXAGE', () => {
    vi.stubEnv('SURGIO_PROVIDER_CACHE_MAXAGE', '60000')
    vi.stubEnv('SURGIO_RENDERED_ARTIFACT_CACHE_MAXAGE', '120000')
    expect(getRenderedArtifactCacheMaxage()).toBe(120_000)
  })
})
