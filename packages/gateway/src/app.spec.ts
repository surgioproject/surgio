import { describe, expect, test, vi } from 'vitest'

import { createGatewayApp } from './app.js'

import type {
  GatewayAuthProvider,
  GatewayCache,
  GatewayConfig,
  GatewayRuntime,
} from './types.js'

const config: GatewayConfig = {
  urlBase: 'https://example.com/',
  publicUrl: 'https://example.com/',
  coreVersion: '4.0.0',
  auth: true,
  accessToken: 'admin-token',
  viewerToken: 'viewer-token',
  useCacheOnError: true,
}

const createFixture = (overrides: Partial<GatewayConfig> = {}) => {
  const gatewayConfig = { ...config, ...overrides }
  const values = new Map<string, unknown>()
  const cacheSet = vi.fn(async (key: string, value: unknown) => {
    values.set(key, value)
  })
  const cacheGet = vi.fn(async (key: string) => values.get(key) as never)
  const cache: GatewayCache = { get: cacheGet, set: cacheSet }
  const runtime: GatewayRuntime = {
    renderArtifact: vi.fn(async (name, options) => ({
      body: `${name}:${JSON.stringify(options?.customParams)}`,
      artifact: { name },
      subscriptionUserInfo: { upload: 1, download: 2, total: 3, expire: 4 },
      subscriptionUserInfoMap: {},
    })),
    renderProviders: vi.fn(async (options) => ({
      body: `providers:${(options.providers as string[]).join(',')}`,
      artifact: { name: 'providers.conf' },
      subscriptionUserInfoMap: {},
    })),
    renderTemplate: vi.fn(async (name) => `template:${name}`),
    listArtifacts: () => [{ name: 'demo.conf', provider: 'demo' }],
    listProviders: () => ['demo'],
    getProviderInfo: vi.fn(async (name) =>
      name === 'demo'
        ? { name, type: 'custom', supportGetSubscriptionUserInfo: true }
        : undefined
    ),
    getProviderSubscription: vi.fn(async () => ({
      upload: 1024,
      download: 2048,
      total: 10240,
      expire: new Date(2030, 0, 1).getTime() / 1000,
    })),
    getGatewayConfig: () => gatewayConfig,
    resetCache: vi.fn(async () => undefined),
    close: vi.fn(async () => undefined),
  }
  const app = createGatewayApp({
    runtime,
    cache,
    assets: { fetch: async () => new Response('spa') },
    logger: { warn: vi.fn(), error: vi.fn() },
  })
  return { app, cacheGet, cacheSet, runtime, values }
}

const auth = { Authorization: 'Bearer admin-token' }

describe('createGatewayApp', () => {
  test('uses the shared Gateway logger by default', async () => {
    const { runtime } = createFixture()
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const app = createGatewayApp({ runtime })

    const response = await app.request(
      '/get-artifact/demo.conf?access_token=viewer-token'
    )

    expect(response.status).toBe(200)
    expect(warn).toHaveBeenCalledWith(
      expect.stringMatching(
        / \[surgio:gateway\] warn: \[download-artifact\] demo\.conf "-"$/
      )
    )
  })

  test('renders artifacts and preserves safe structured query values', async () => {
    const { app, cacheSet, runtime } = createFixture()
    const response = await app.request(
      '/get-artifact/demo.conf?access_token=viewer-token&foo[]=first&foo[]=second&child[bar]=nested&constructor.prototype.polluted=yes'
    )
    expect(response.status).toBe(200)
    expect(response.headers.get('subscription-userinfo')).toBe(
      'upload=1; download=2; total=3; expire=4'
    )
    expect(await response.text()).toContain(
      '"foo":["first","second"],"child":{"bar":"nested"}'
    )
    expect(({} as { polluted?: string }).polluted).toBeUndefined()
    expect(runtime.renderArtifact).toHaveBeenCalledOnce()
    expect(runtime.renderArtifact).toHaveBeenCalledWith(
      'demo.conf',
      expect.objectContaining({
        downloadUrl:
          'https://example.com/get-artifact/demo.conf?access_token=viewer-token&foo[]=first&foo[]=second&child[bar]=nested&constructor.prototype.polluted=yes',
      })
    )
    expect(cacheSet).toHaveBeenCalledWith(
      expect.stringMatching(/^artifact-fallback:/),
      expect.any(String),
      24 * 60 * 60_000
    )
  })

  test('只把声明过的请求头交给 Provider', async () => {
    const { app, runtime } = createFixture()
    await app.request('/get-artifact/demo.conf?access_token=viewer-token', {
      headers: {
        'user-agent': 'Surge iOS/2920',
        'cf-ray': '8f0c2b1a4e9d0001-SJC',
        cookie: 'surgio=session',
        'x-surge-unlocked-features': 'vif',
      },
    })

    const [, options] = vi.mocked(runtime.renderArtifact).mock.calls[0]
    expect(options?.getNodeListParams).toEqual({
      requestHeaders: { 'x-surge-unlocked-features': 'vif' },
    })
  })

  test('按配置放行 User-Agent 与额外请求头', async () => {
    const { app, runtime } = createFixture({
      passRequestUserAgent: true,
      passRequestHeaders: ['Accept-Language'],
    })
    await app.request('/get-artifact/demo.conf?access_token=viewer-token', {
      headers: {
        'user-agent': 'Surge iOS/2920',
        'accept-language': 'zh-CN',
        'cf-ray': '8f0c2b1a4e9d0001-SJC',
      },
    })

    const [, options] = vi.mocked(runtime.renderArtifact).mock.calls[0]
    expect(options?.getNodeListParams).toMatchObject({
      requestUserAgent: 'Surge iOS/2920',
      requestHeaders: {
        'accept-language': 'zh-CN',
        'user-agent': 'Surge iOS/2920',
      },
    })
  })

  test('关闭 useCacheOnError 后不再读写兜底缓存', async () => {
    const { app, cacheGet, cacheSet, runtime } = createFixture({
      useCacheOnError: false,
    })

    const ok = await app.request(
      '/get-artifact/demo.conf?access_token=viewer-token'
    )
    expect(ok.status).toBe(200)
    expect(cacheSet).not.toHaveBeenCalled()

    vi.mocked(runtime.renderArtifact).mockRejectedValueOnce(
      new Error('offline')
    )
    const failed = await app.request(
      '/get-artifact/demo.conf?access_token=viewer-token'
    )

    expect(failed.status).toBe(500)
    expect(cacheGet).not.toHaveBeenCalled()
  })

  test('请求头与 query 顺序不影响兜底缓存 key', async () => {
    const { app, cacheSet } = createFixture()
    await app.request(
      '/get-artifact/demo.conf?access_token=viewer-token&a=1&b=2'
    )
    await app.request(
      '/get-artifact/demo.conf?b=2&access_token=viewer-token&a=1'
    )

    expect(cacheSet.mock.calls[0][0]).toBe(cacheSet.mock.calls[1][0])
  })

  test('supports download and provider export aliases', async () => {
    const { app, runtime } = createFixture()
    const artifact = await app.request(
      '/get-artifact/demo.conf?access_token=viewer-token&dl=1&format=surge-policy'
    )
    expect(artifact.headers.get('content-disposition')).toBe(
      'attachment; filename="demo.conf"'
    )
    expect(runtime.renderArtifact).toHaveBeenCalledWith(
      'demo.conf',
      expect.objectContaining({ format: 'surge' })
    )

    const providers = await app.request(
      '/export-providers?access_token=viewer-token&providers=demo&format=qx-server'
    )
    expect(await providers.text()).toBe('providers:demo')
    expect(runtime.renderProviders).toHaveBeenCalledWith(
      expect.objectContaining({ format: 'quantumultx' })
    )
  })

  test('validates provider export input and missing resources', async () => {
    const { app } = createFixture()
    expect(
      (await app.request('/export-providers?access_token=viewer-token')).status
    ).toBe(400)
    expect(
      (
        await app.request(
          '/export-providers?access_token=viewer-token&providers=missing&format=surge-policy'
        )
      ).status
    ).toBe(404)
    expect(
      (await app.request('/get-artifact/missing?access_token=viewer-token'))
        .status
    ).toBe(404)
  })

  test('renders templates and serves assets as SPA fallback', async () => {
    const { app } = createFixture()
    const rendered = await app.request(
      '/render?access_token=viewer-token&template=folder%2Fdemo'
    )
    expect(await rendered.text()).toBe('template:folder/demo')
    expect(
      (await app.request('/render?access_token=viewer-token')).status
    ).toBe(400)
    expect(await (await app.request('/')).text()).toBe('spa')
  })

  test('implements login, cookie, bearer, query token and roles', async () => {
    const { app } = createFixture()
    const login = await app.request('/api/auth', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ accessToken: 'admin-token' }),
    })
    expect(login.status).toBe(200)
    const cookie = login.headers.get('set-cookie') as string
    expect(cookie).toContain('_t=')
    expect(
      (
        await app.request('/api/auth/validate-cookie', {
          method: 'POST',
          headers: { cookie },
        })
      ).status
    ).toBe(200)
    expect(
      (
        await app.request('/api/auth/validate-token', {
          method: 'POST',
          headers: auth,
        })
      ).status
    ).toBe(200)
    expect(
      (await app.request('/api/artifacts?access_token=viewer-token')).status
    ).toBe(403)
    expect(
      (await app.request('/api/artifacts', { headers: auth })).status
    ).toBe(200)
    expect(
      (await app.request('/api/auth', { method: 'POST', body: '{}' })).status
    ).toBe(401)
    expect(
      (await app.request('/api/auth/logout', { method: 'POST' })).headers.get(
        'set-cookie'
      )
    ).toContain('_t=')
    expect((await app.request('/api/auth/logout')).status).toBe(302)
  })

  test('exposes all management API contracts', async () => {
    const { app, runtime } = createFixture()
    expect((await app.request('/api/config')).status).toBe(200)
    expect(
      (await app.request('/api/artifacts/demo.conf?access_token=viewer-token'))
        .status
    ).toBe(200)
    expect(
      (await app.request('/api/artifacts/missing?access_token=viewer-token'))
        .status
    ).toBe(404)
    expect(
      (await app.request('/api/providers', { headers: auth })).status
    ).toBe(200)
    expect(
      (await app.request('/api/providers/demo/subscription', { headers: auth }))
        .status
    ).toBe(200)
    expect(
      (
        await app.request('/api/providers/missing/subscription', {
          headers: auth,
        })
      ).status
    ).toBe(404)
    expect(
      (await app.request('/api/clean-cache', { method: 'POST', headers: auth }))
        .status
    ).toBe(200)
    expect(runtime.resetCache).toHaveBeenCalledOnce()
  })

  test('formats subscription usage and expiry for the frontend', async () => {
    const { app } = createFixture()
    const response = await app.request('/api/providers/demo/subscription', {
      headers: auth,
    })

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      status: 'ok',
      data: {
        upload: '1 KiB',
        download: '2 KiB',
        used: '3 KiB',
        left: '7 KiB',
        total: '10 KiB',
        expire: expect.stringMatching(/^2030-01-01 \(.+\)$/),
      },
    })
  })

  test('formats zero usage and an unknown expiry', async () => {
    const { app, runtime } = createFixture()
    vi.mocked(runtime.getProviderSubscription).mockResolvedValueOnce({
      upload: 0,
      download: 0,
      total: 1024,
      expire: 0,
    })
    const response = await app.request('/api/providers/demo/subscription', {
      headers: auth,
    })

    expect(await response.json()).toEqual({
      status: 'ok',
      data: {
        upload: '0 B',
        download: '0 B',
        used: '0 B',
        left: '1 KiB',
        total: '1 KiB',
        expire: '无数据',
      },
    })
  })

  test('returns null when a subscription has no usage metadata', async () => {
    const { app, runtime } = createFixture()
    vi.mocked(runtime.getProviderSubscription).mockResolvedValueOnce(undefined)
    const response = await app.request('/api/providers/demo/subscription', {
      headers: auth,
    })

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ status: 'ok', data: null })
  })

  test('uses cached payload when rendering fails', async () => {
    const { app, runtime } = createFixture()
    const url = '/get-artifact/demo.conf?access_token=viewer-token'
    expect((await app.request(url)).status).toBe(200)
    vi.mocked(runtime.renderArtifact).mockRejectedValueOnce(
      new Error('offline')
    )
    const cached = await app.request(url)
    expect(cached.status).toBe(200)
    expect(cached.headers.get('x-use-cache')).toBe('true')
  })
})

describe('authProvider', () => {
  const artifactUrl = '/get-artifact/demo.conf'
  const createProviderFixture = (authProvider: GatewayAuthProvider) =>
    createFixture({ viewerToken: undefined, authProvider })

  test('admin token 与 cookie 不调用 provider', async () => {
    const authProvider = vi.fn<GatewayAuthProvider>(async () => ({
      success: false,
    }))
    const { app } = createProviderFixture(authProvider)
    const login = await app.request('/api/auth', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ accessToken: 'admin-token' }),
    })
    const cookie = login.headers.get('set-cookie') as string

    expect((await app.request(artifactUrl, { headers: auth })).status).toBe(200)
    expect((await app.request(artifactUrl, { headers: { cookie } })).status).toBe(
      200
    )
    expect(authProvider).not.toHaveBeenCalled()
  })

  test('provider 成功时获得 viewer 角色', async () => {
    const authProvider = vi.fn<GatewayAuthProvider>(async () => ({
      success: true,
      accessToken: 'user-a',
    }))
    const { app } = createProviderFixture(authProvider)
    const headers = { Authorization: 'Bearer user-a' }

    expect((await app.request(artifactUrl, { headers })).status).toBe(200)
    expect((await app.request('/api/providers', { headers })).status).toBe(403)
  })

  test('provider 失败时返回 401', async () => {
    const { app } = createProviderFixture(async () => ({ success: false }))

    expect((await app.request(`${artifactUrl}?access_token=x`)).status).toBe(
      401
    )
  })

  test('provider 抛错时返回 500', async () => {
    const authProvider = vi
      .fn<GatewayAuthProvider>()
      .mockRejectedValue(new Error('backend down'))
    const { app } = createProviderFixture(authProvider)

    const response = await app.request(`${artifactUrl}?access_token=x`)

    expect(response.status).toBe(500)
    expect(await response.text()).not.toContain('backend down')
  })

  test('请求不带任何凭据时仍调用 provider', async () => {
    const authProvider = vi.fn<GatewayAuthProvider>(async () => ({
      success: true,
      accessToken: 'user-a',
    }))
    const { app } = createProviderFixture(authProvider)

    const response = await app.request(artifactUrl)

    expect(response.status).toBe(200)
    expect(authProvider).toHaveBeenCalledOnce()
  })

  test('provider 收到原始 Request', async () => {
    const authProvider = vi.fn<GatewayAuthProvider>(async () => ({
      success: false,
    }))
    const { app } = createProviderFixture(authProvider)

    await app.request(`${artifactUrl}?access_token=k`, {
      headers: { Authorization: 'Bearer from-header' },
    })

    const { request } = authProvider.mock.calls[0][0]
    expect(request).toBeInstanceOf(Request)
    expect(request.url).toContain('access_token=k')
    expect(request.headers.get('authorization')).toBe('Bearer from-header')
  })

  test('success 但 accessToken 为空串时返回 401', async () => {
    const { app } = createProviderFixture(async () => ({
      success: true,
      accessToken: '',
    }))

    expect((await app.request(`${artifactUrl}?access_token=k`)).status).toBe(
      401
    )
  })

  test('provider resolve undefined 时返回 401', async () => {
    const { app } = createProviderFixture(
      (async () => undefined) as unknown as GatewayAuthProvider
    )

    expect((await app.request(`${artifactUrl}?access_token=k`)).status).toBe(
      401
    )
  })

  test('provider 返回 gateway.accessToken 时返回 500', async () => {
    const { app } = createProviderFixture(async () => ({
      success: true,
      accessToken: 'admin-token',
    }))

    expect((await app.request(`${artifactUrl}?access_token=k`)).status).toBe(
      500
    )
  })
})
