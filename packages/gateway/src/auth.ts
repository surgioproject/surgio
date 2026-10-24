import { deleteCookie, getCookie, setCookie } from 'hono/cookie'

import type { Context } from 'hono'
import type { GatewayAuthProvider, GatewayConfig, GatewayUser } from './types.js'

const encoder = new TextEncoder()

const toHex = (input: ArrayBuffer): string =>
  [...new Uint8Array(input)].map((item) => item.toString(16).padStart(2, '0')).join('')

export const signAccessToken = async (token: string): Promise<string> => {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(token || 'surgio-gateway'),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  return toHex(await crypto.subtle.sign('HMAC', key, encoder.encode(token)))
}

export const authenticate = async (
  context: Context,
  config: GatewayConfig,
): Promise<GatewayUser | undefined> => {
  if (!config.auth) return { roles: ['admin', 'viewer'] }
  const authorization = context.req.header('authorization')
  const bearer = authorization?.match(/^Bearer\s+(.+)$/i)?.[1]
  const token = bearer ?? context.req.query('access_token')
  if (token && token === config.accessToken) return { roles: ['admin', 'viewer'] }
  if (token && token === config.viewerToken) return { roles: ['viewer'] }
  const cookie = getCookie(context, '_t')
  if (cookie && cookie === (await signAccessToken(config.accessToken ?? ''))) {
    return { roles: ['admin', 'viewer'] }
  }
  return config.authProvider
    ? resolveWithAuthProvider(context, config.authProvider, config)
    : undefined
}

const resolveWithAuthProvider = async (
  context: Context,
  authProvider: GatewayAuthProvider,
  config: GatewayConfig,
): Promise<GatewayUser | undefined> => {
  const result: unknown = await authProvider({ request: context.req.raw })
  if (typeof result !== 'object' || result === null) return undefined
  const { success, accessToken } = result as Record<string, unknown>
  if (success !== true || typeof accessToken !== 'string' || !accessToken) {
    return undefined
  }
  // Viewer links must never carry the admin token.
  if (accessToken === config.accessToken) {
    throw new Error('authProvider 不能返回 gateway.accessToken')
  }
  return { roles: ['viewer'], linkToken: accessToken }
}

export const setAuthCookie = async (context: Context, config: GatewayConfig): Promise<void> => {
  setCookie(context, '_t', await signAccessToken(config.accessToken ?? ''), {
    httpOnly: true,
    path: '/',
    maxAge: config.cookieMaxAge ?? 60 * 60 * 24 * 31,
    sameSite: 'Lax',
  })
}

export const clearAuthCookie = (context: Context): void => {
  deleteCookie(context, '_t', { path: '/' })
}
