import { Hono } from 'hono'

import gatewayPackage from '../package.json' with { type: 'json' }
import { authenticate, clearAuthCookie, setAuthCookie } from './auth.js'
import { gatewayLogger } from './logger.js'
import { formatSubscriptionUserInfo } from './subscription.js'
import {
  omitQuery,
  parseStructuredQuery,
  pickHeaders,
  stableStringify,
} from './query.js'

import type { Context, MiddlewareHandler } from 'hono'
import type {
  GatewayAssets,
  GatewayCache,
  GatewayConfig,
  GatewayLogger,
  GatewayRole,
  GatewayRuntime,
  GatewayRenderResult,
  GatewayUser,
} from './types.js'

export interface GatewayEnv<Bindings extends object> {
  Bindings: Bindings
  Variables: { user: GatewayUser }
}

export interface GatewayAppOptions<Bindings extends object = object> {
  readonly runtime:
    | GatewayRuntime
    | ((
        context: Context<{ Bindings: Bindings }>
      ) => GatewayRuntime | Promise<GatewayRuntime>)
  readonly cache?:
    | GatewayCache
    | ((context: Context<{ Bindings: Bindings }>) => GatewayCache | undefined)
  readonly assets?:
    | GatewayAssets
    | ((context: Context<{ Bindings: Bindings }>) => GatewayAssets | undefined)
  readonly errorCacheTtl?: number
  readonly logger?: GatewayLogger
}

const textHeaders = {
  'content-type': 'text/plain; charset=utf-8',
  'cache-control': 'private, no-cache, no-store',
}

const errorJson = (context: Context, status: number, error: string): Response =>
  context.json({ status: 'error', statusCode: status, error }, status as 400)

const digestKey = async (value: string): Promise<string> => {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(value)
  )
  return [...new Uint8Array(digest)]
    .map((item) => item.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 32)
}

const subscriptionHeader = (info: Readonly<Record<string, number>>): string =>
  ['upload', 'download', 'total', 'expire']
    .map((key) => `${key}=${info[key] || 0}`)
    .join('; ')

const addToken = (base: string, path: string, token?: string): string => {
  const url = new URL(path, base)
  if (token) url.searchParams.set('access_token', token)
  return url.toString()
}

const publicRequestUrl = (
  requestUrl: string,
  publicUrl: string,
  linkToken?: string
): string => {
  const request = new URL(requestUrl)
  const url = new URL(`${request.pathname}${request.search}`, publicUrl)
  // The caller may have authenticated by header, so the link needs its own token.
  if (linkToken) url.searchParams.set('access_token', linkToken)
  return url.toString()
}

const linkTokenOf = (context: Context): string | undefined =>
  (context.get('user' as never) as GatewayUser).linkToken

/** 与 surgio 的 PASS_GATEWAY_REQUEST_HEADERS_WHITELIST 保持一致。 */
const alwaysPassedRequestHeaders = ['x-surge-unlocked-features']

/**
 * 只把项目声明过的请求头交给 Provider。未声明的头不会影响抓取结果，却会让渲染缓存的
 * key 逐请求变化（cf-ray、x-forwarded-for、auth cookie）。
 */
const allowedRequestHeaders = (config: GatewayConfig): Set<string> =>
  new Set([
    ...(config.passRequestHeaders ?? []).map((header) => header.toLowerCase()),
    ...alwaysPassedRequestHeaders,
    ...(config.passRequestUserAgent ? ['user-agent'] : []),
  ])

const fallbackCacheKey = async (parts: unknown): Promise<string> =>
  `artifact-fallback:${await digestKey(stableStringify(parts))}`

const providerFormat = (format: string): string => {
  const aliases: Record<string, string> = {
    'surge-policy': 'surge',
    'qx-server': 'quantumultx',
    ss: 'shadowsocks',
    ssr: 'shadowsocksr',
    v2ray: 'v2rayn',
  }
  return aliases[format] ?? format
}

export const createGatewayApp = <Bindings extends object = object>(
  options: GatewayAppOptions<Bindings>
): Hono<GatewayEnv<Bindings>> => {
  const app = new Hono<GatewayEnv<Bindings>>()
  const errorCacheTtl = options.errorCacheTtl ?? 24 * 60 * 60_000
  const logger = options.logger ?? gatewayLogger
  const runtimeFor = async (context: Context): Promise<GatewayRuntime> =>
    typeof options.runtime === 'function'
      ? options.runtime(context as Context<{ Bindings: Bindings }>)
      : options.runtime
  const cacheFor = (context: Context): GatewayCache | undefined =>
    typeof options.cache === 'function'
      ? options.cache(context as Context<{ Bindings: Bindings }>)
      : options.cache
  const assetsFor = (context: Context): GatewayAssets | undefined =>
    typeof options.assets === 'function'
      ? options.assets(context as Context<{ Bindings: Bindings }>)
      : options.assets

  app.use('/api/*', async (context, next) => {
    await next()
    context.header(
      'cache-control',
      'private, no-cache, no-store, must-revalidate'
    )
  })

  const requireRole =
    (role: GatewayRole): MiddlewareHandler<GatewayEnv<Bindings>> =>
    async (context, next) => {
      const config = (await runtimeFor(context)).getGatewayConfig()
      if (!config) return errorJson(context, 500, 'Gateway 未配置')
      const user = await authenticate(context, config)
      if (!user) return errorJson(context, 401, 'Unauthorized')
      if (!user.roles.includes(role))
        return errorJson(context, 403, 'Forbidden')
      context.set('user', user)
      await next()
    }

  const sendResult = async (
    context: Context,
    result: GatewayRenderResult | string,
    cacheKey: string | undefined,
    cached: boolean,
    attachment?: string
  ): Promise<Response> => {
    const body = typeof result === 'string' ? result : result.body
    if (cacheKey && !cached)
      await cacheFor(context)?.set(cacheKey, body, errorCacheTtl)
    if (cached) context.header('x-use-cache', 'true')
    if (attachment)
      context.header(
        'content-disposition',
        `attachment; filename="${attachment}"`
      )
    if (typeof result !== 'string' && result.subscriptionUserInfo && !cached) {
      context.header(
        'subscription-userinfo',
        subscriptionHeader(result.subscriptionUserInfo)
      )
    }
    return context.body(body, 200, textHeaders)
  }

  app.get('/get-artifact/:name', requireRole('viewer'), async (context) => {
    const runtime = await runtimeFor(context)
    const name = context.req.param('name')
    if (!runtime.listArtifacts().some((artifact) => artifact.name === name))
      return errorJson(context, 404, 'NOT FOUND')
    const query = parseStructuredQuery(new URL(context.req.url))
    const format = typeof query.format === 'string' ? query.format : undefined
    const filter = typeof query.filter === 'string' ? query.filter : undefined
    const customParams = omitQuery(query, [
      'dl',
      'format',
      'filter',
      'access_token',
    ])
    const userAgent = context.req.header('user-agent') ?? ''
    const config = runtime.getGatewayConfig() as GatewayConfig
    const requestHeaders = pickHeaders(
      context.req.raw.headers,
      allowedRequestHeaders(config)
    )
    const passUserAgent = Boolean(config.passRequestUserAgent && userAgent)
    const linkToken = linkTokenOf(context)
    const cacheKey = config.useCacheOnError
      ? await fallbackCacheKey([
          name,
          omitQuery(query, ['access_token']),
          requestHeaders,
          passUserAgent ? userAgent : '',
          // Rendered links embed the token, so viewers must not share entries.
          ...(linkToken ? [linkToken] : []),
        ])
      : undefined
    try {
      const result = await runtime.renderArtifact(name, {
        customParams,
        downloadUrl: publicRequestUrl(
          context.req.url,
          config.publicUrl,
          linkToken
        ),
        filter,
        ...(linkToken ? { accessToken: linkToken } : undefined),
        ...(format ? { format: providerFormat(format) } : undefined),
        getNodeListParams: {
          ...customParams,
          ...(passUserAgent ? { requestUserAgent: userAgent } : undefined),
          requestHeaders,
        },
      })
      logger.warn(`[download-artifact] ${name} "${userAgent || '-'}"`)
      return sendResult(
        context,
        result,
        cacheKey,
        false,
        query.dl === '1' ? name : undefined
      )
    } catch (error) {
      const cached = cacheKey
        ? await cacheFor(context)?.get<string>(cacheKey)
        : undefined
      if (cached !== undefined) {
        logger.warn('Artifact 生成错误，使用缓存', error)
        return sendResult(
          context,
          cached,
          cacheKey,
          true,
          query.dl === '1' ? name : undefined
        )
      }
      throw error
    }
  })

  app.get('/export-providers', requireRole('viewer'), async (context) => {
    const runtime = await runtimeFor(context)
    const query = parseStructuredQuery(new URL(context.req.url))
    const providers =
      typeof query.providers === 'string'
        ? query.providers
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean)
        : []
    if (!providers.length)
      return errorJson(context, 400, '参数 provider 必须指定至少一个值')
    for (const provider of providers) {
      if (!runtime.listProviders().includes(provider))
        return errorJson(context, 404, `provider ${provider} 不存在`)
    }
    const format = typeof query.format === 'string' ? query.format : undefined
    const template =
      typeof query.template === 'string' ? query.template : undefined
    if (!format && !template)
      return errorJson(
        context,
        400,
        '参数 format 和 template 必须指定至少一个值'
      )
    const userAgent = context.req.header('user-agent') ?? ''
    const config = runtime.getGatewayConfig() as GatewayConfig
    const requestHeaders = pickHeaders(
      context.req.raw.headers,
      allowedRequestHeaders(config)
    )
    const passUserAgent = Boolean(config.passRequestUserAgent && userAgent)
    const linkToken = linkTokenOf(context)
    const cacheKey = config.useCacheOnError
      ? await fallbackCacheKey([
          'export-providers',
          omitQuery(query, ['access_token']),
          requestHeaders,
          passUserAgent ? userAgent : '',
          ...(linkToken ? [linkToken] : []),
        ])
      : undefined
    const customParams = omitQuery(query, [
      'dl',
      'format',
      'template',
      'filter',
      'access_token',
      'providers',
    ])
    try {
      const result = await runtime.renderProviders({
        providers,
        ...(format ? { format: providerFormat(format) } : undefined),
        ...(template ? { template } : undefined),
        ...(typeof query.filter === 'string'
          ? { filter: query.filter }
          : undefined),
        customParams,
        downloadUrl: publicRequestUrl(
          context.req.url,
          config.publicUrl,
          linkToken
        ),
        ...(linkToken ? { accessToken: linkToken } : undefined),
        getNodeListParams: {
          ...customParams,
          ...(passUserAgent ? { requestUserAgent: userAgent } : undefined),
          requestHeaders,
        },
      })
      return sendResult(
        context,
        result,
        cacheKey,
        false,
        query.dl === '1' ? result.artifact.name : undefined
      )
    } catch (error) {
      const cached = cacheKey
        ? await cacheFor(context)?.get<string>(cacheKey)
        : undefined
      if (cached !== undefined)
        return sendResult(context, cached, cacheKey, true)
      throw error
    }
  })

  app.get('/render', requireRole('viewer'), async (context) => {
    const runtime = await runtimeFor(context)
    const template = context.req.query('template')
    if (!template)
      return errorJson(context, 400, '参数 template 必须指定一个值')
    const config = runtime.getGatewayConfig() as GatewayConfig
    const linkToken = linkTokenOf(context)
    // Never hand the admin token to a viewer, who may be the one reading this page.
    const getUrlToken = linkToken ?? config.viewerToken ?? config.accessToken
    try {
      const body = await runtime.renderTemplate(template, {
        downloadUrl: publicRequestUrl(
          context.req.url,
          config.publicUrl,
          linkToken
        ),
        getUrl: (path: string) => addToken(config.publicUrl, path, getUrlToken),
      })
      return context.body(
        body,
        200,
        config.authProvider
          ? textHeaders
          : {
              'content-type': 'text/plain; charset=utf-8',
              'cache-control': 's-maxage=86400, stale-while-revalidate',
            }
      )
    } catch (error) {
      if (
        error instanceof Error &&
        /template not found|模板.*不存在/i.test(error.message)
      )
        return errorJson(context, 404, 'NOT FOUND')
      throw error
    }
  })

  app.post('/api/clean-cache', requireRole('admin'), async (context) => {
    await (await runtimeFor(context)).resetCache()
    return context.json({ status: 'ok' })
  })
  app.get('/api/artifacts', requireRole('admin'), async (context) =>
    context.json({
      status: 'ok',
      data: (await runtimeFor(context)).listArtifacts(),
    })
  )
  app.get('/api/artifacts/:name', requireRole('viewer'), async (context) => {
    const artifact = (await runtimeFor(context))
      .listArtifacts()
      .find((item) => item.name === context.req.param('name'))
    return artifact
      ? context.json({ status: 'ok', data: artifact })
      : errorJson(context, 404, 'NOT FOUND')
  })
  app.get('/api/providers', requireRole('admin'), async (context) => {
    const runtime = await runtimeFor(context)
    const data = (
      await Promise.all(
        runtime.listProviders().map((name) => runtime.getProviderInfo(name))
      )
    ).filter(Boolean)
    return context.json({ status: 'ok', data })
  })
  app.get(
    '/api/providers/:name/subscription',
    requireRole('admin'),
    async (context) => {
      const runtime = await runtimeFor(context)
      const provider = await runtime.getProviderInfo(context.req.param('name'))
      if (!provider) return errorJson(context, 404, 'NOT FOUND')
      if (!provider.supportGetSubscriptionUserInfo)
        return errorJson(context, 400, 'BAD REQUEST')
      const info = await runtime.getProviderSubscription(provider.name)
      return context.json({
        status: 'ok',
        data: info ? formatSubscriptionUserInfo(info) : null,
      })
    }
  )

  app.post('/api/auth', async (context) => {
    const config = (await runtimeFor(context)).getGatewayConfig()
    if (!config) return errorJson(context, 500, 'Gateway 未配置')
    const body = await context.req
      .json<{ accessToken?: string }>()
      .catch((): { accessToken?: string } => ({}))
    if (body.accessToken !== config.accessToken)
      return errorJson(context, 401, 'Unauthorized')
    await setAuthCookie(context, config)
    return context.json({ status: 'ok' })
  })
  app.post('/api/auth/logout', (context) => {
    clearAuthCookie(context)
    return context.json({ status: 'ok' })
  })
  app.get('/api/auth/logout', (context) => {
    clearAuthCookie(context)
    return context.redirect('/auth')
  })
  const validate = async (context: Context): Promise<Response> => {
    const config = (
      await runtimeFor(context)
    ).getGatewayConfig() as GatewayConfig
    const user = await authenticate(context, config)
    if (!user) return errorJson(context, 401, 'Unauthorized')
    // A static viewer must not learn the admin token.
    const linkTokenFor = (current: GatewayUser): string | undefined =>
      current.linkToken ??
      (current.roles.includes('admin')
        ? config.accessToken
        : config.viewerToken)
    return context.json({
      status: 'ok',
      data: {
        roles: user.roles,
        ...(config.viewerToken
          ? { viewerToken: config.viewerToken }
          : undefined),
        ...(config.authProvider
          ? { accessToken: linkTokenFor(user) }
          : undefined),
      },
    })
  }
  app.post('/api/auth/validate-token', validate)
  app.post('/api/auth/validate-cookie', validate)
  app.get('/api/config', async (context) => {
    const config = (await runtimeFor(context)).getGatewayConfig()
    if (!config) return errorJson(context, 500, 'Gateway 未配置')
    return context.json({
      status: 'ok',
      data: {
        urlBase: config.urlBase,
        publicUrl: config.publicUrl,
        backendVersion: gatewayPackage.version,
        coreVersion: config.coreVersion,
        needAuth: config.auth ?? false,
      },
    })
  })

  app.onError((error, context) => {
    logger.error('Gateway request failed', error)
    return errorJson(
      context,
      500,
      error instanceof Error ? error.message : 'Internal Server Error'
    )
  })
  app.notFound(async (context) => {
    const assets = assetsFor(context)
    return assets
      ? assets.fetch(context.req.raw)
      : errorJson(context, 404, 'NOT FOUND')
  })
  return app
}
