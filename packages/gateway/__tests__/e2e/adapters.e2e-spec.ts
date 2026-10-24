import { once } from 'node:events'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { createLambdaHandler } from '../../src/lambda.js'
import { gatewayLogger } from '../../src/logger.js'
import { startServer } from '../../src/node.js'

import type { AddressInfo } from 'node:net'
import type { GatewayRuntime } from '../../src/types.js'

const runtime: GatewayRuntime = {
  async renderArtifact(name) {
    return { body: name, artifact: { name }, subscriptionUserInfoMap: {} }
  },
  async renderProviders() {
    return { body: 'providers', artifact: { name: 'providers.conf' }, subscriptionUserInfoMap: {} }
  },
  async renderTemplate(name) {
    return name
  },
  listArtifacts: () => [{ name: 'demo.conf' }],
  listProviders: () => [],
  async getProviderInfo() {
    return undefined
  },
  async getProviderSubscription() {
    return undefined
  },
  getGatewayConfig: () => ({
    urlBase: 'https://example.com/',
    publicUrl: 'https://example.com/',
    coreVersion: '4.0.0',
    accessToken: 'admin-token',
    auth: false,
  }),
  async resetCache() {},
  async close() {},
}

const assetsDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../node_modules/@surgio/gateway-frontend/build',
)

describe('platform adapters', () => {
  test('serves the Hono app through a real Node HTTP server', async () => {
    const info = vi
      .spyOn(gatewayLogger, 'info')
      .mockImplementation(() => undefined)
    const server = await startServer({ runtime, assetsDir, port: 0 })
    const { port } = server.address() as AddressInfo
    const response = await fetch(`http://127.0.0.1:${port}/get-artifact/demo.conf`)
    expect(response.status).toBe(200)
    expect(await response.text()).toBe('demo.conf')

    const authResponse = await fetch(`http://127.0.0.1:${port}/api/auth`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ accessToken: 'admin-token' }),
    })
    expect(authResponse.status).toBe(200)
    expect(await authResponse.json()).toEqual({ status: 'ok' })

    expect(info).toHaveBeenCalledWith(
      '> Your app is ready at %s',
      'http://127.0.0.1:0',
    )
    server.close()
    await once(server, 'close')
  })

  test('serves the same app through the AWS Lambda adapter', async () => {
    const handler = createLambdaHandler({ runtime, assetsDir })
    const response = await handler({
      version: '2.0',
      routeKey: '$default',
      rawPath: '/api/config',
      rawQueryString: '',
      body: null,
      headers: { host: 'example.com' },
      requestContext: {
        accountId: 'test',
        apiId: 'test',
        authentication: null,
        authorizer: {},
        domainName: 'example.com',
        domainPrefix: 'example',
        http: {
          method: 'GET',
          path: '/api/config',
          protocol: 'HTTP/1.1',
          sourceIp: '127.0.0.1',
          userAgent: 'vitest',
        },
        requestId: 'test',
        routeKey: '$default',
        stage: '$default',
        time: 'now',
        timeEpoch: Date.now(),
      },
      isBase64Encoded: false,
    })
    expect(response.statusCode).toBe(200)
    expect(JSON.parse(response.body).status).toBe('ok')
  })
})
