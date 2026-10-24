import { createServer } from 'node:http'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { getRequestListener } from '@hono/node-server'

import { createGatewayApp } from './app.js'
import { gatewayLogger } from './logger.js'

import type { Server } from 'node:http'
import type { GatewayAppOptions } from './app.js'
import type { GatewayAssets, GatewayCache, GatewayRuntime } from './types.js'

export interface NodeGatewayOptions {
  readonly cwd?: string
  readonly project?: unknown
  readonly runtime?: GatewayRuntime
  readonly runtimeOptions?: Readonly<Record<string, unknown>>
  readonly cache?: GatewayCache
  readonly assetsDir?: string
  readonly errorCacheTtl?: number
  readonly hostname?: string
  readonly port?: number
  readonly logger?: GatewayAppOptions['logger']
}

const contentTypes: Readonly<Record<string, string>> = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
}

const defaultAssetsDir = (): string => {
  const packageFile = import.meta
    .resolve('@surgio/gateway-frontend/package.json')
  return path.join(path.dirname(fileURLToPath(packageFile)), 'build')
}

const createFilesystemAssets = (directory: string): GatewayAssets => ({
  async fetch(request) {
    const pathname = decodeURIComponent(new URL(request.url).pathname)
    const relative = pathname === '/' ? 'index.html' : pathname.slice(1)
    const candidate = path.resolve(directory, relative)
    const root = path.resolve(directory)
    const filename = candidate.startsWith(`${root}${path.sep}`)
      ? candidate
      : path.join(root, 'index.html')
    try {
      const content = await fs.readFile(filename)
      return new Response(content, {
        headers: {
          'content-type':
            contentTypes[path.extname(filename)] ?? 'application/octet-stream',
        },
      })
    } catch {
      try {
        const content = await fs.readFile(path.join(root, 'index.html'))
        return new Response(content, {
          headers: { 'content-type': contentTypes['.html'] },
        })
      } catch {
        return new Response('NOT FOUND', { status: 404 })
      }
    }
  },
})

const createRuntime = async (
  options: NodeGatewayOptions
): Promise<GatewayRuntime> => {
  if (options.runtime) return options.runtime
  const projectEntry = 'surgio/project'
  const runtimeEntry = 'surgio/runtime/node'
  const [{ loadSurgioProject }, { createNodeSurgioRuntime }] =
    await Promise.all([import(projectEntry), import(runtimeEntry)])
  const project =
    options.project ?? (await loadSurgioProject(options.cwd ?? process.cwd()))
  return createNodeSurgioRuntime(
    project,
    options.runtimeOptions
  ) as GatewayRuntime
}

const createDefaultCache = (): GatewayCache => {
  let cachePromise: Promise<GatewayCache> | undefined
  const getCache = () =>
    (cachePromise ??= import('surgio/cache').then(
      ({ cache }) => cache as GatewayCache
    ))
  return {
    async get(key) {
      return (await getCache()).get(key)
    },
    async set(key, value, ttl) {
      await (await getCache()).set(key, value, ttl)
    },
  }
}

export const createNodeGatewayApp = (options: NodeGatewayOptions = {}) => {
  let runtimePromise: Promise<GatewayRuntime> | undefined
  const getRuntime = () => (runtimePromise ??= createRuntime(options))
  const cache = options.cache ?? createDefaultCache()
  return createGatewayApp({
    runtime: getRuntime,
    cache,
    assets: createFilesystemAssets(options.assetsDir ?? defaultAssetsDir()),
    errorCacheTtl:
      options.errorCacheTtl ??
      (process.env.SURGIO_GATEWAY_ERROR_CACHE_MAXAGE
        ? Number(process.env.SURGIO_GATEWAY_ERROR_CACHE_MAXAGE)
        : undefined),
    logger: options.logger,
  })
}

export const createHttpServer = (options: NodeGatewayOptions = {}): Server => {
  const app = createNodeGatewayApp(options)
  return createServer(getRequestListener(app.fetch))
}

export const startServer = async (
  options: NodeGatewayOptions = {}
): Promise<Server> => {
  const hostname = options.hostname ?? '127.0.0.1'
  const port = options.port ?? (Number(process.env.PORT) || 4000)
  const server = createHttpServer(options)
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject)
    server.listen(port, hostname, resolve)
  })
  gatewayLogger.info('> Your app is ready at %s', `http://${hostname}:${port}`)
  return server
}
