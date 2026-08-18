import { TtlCache } from '../../../build/cache/core.js'
import { createCloudflareKvStore } from '../../../build/cache/cloudflare.js'
import { env as readEnv } from '../../../build/project/index.js'
import { createSurgioRuntime } from '../../../build/worker/index.js'

import manifest from './.surgio/worker-manifest.mjs'

interface Env {
  SURGIO_CACHE: Parameters<typeof createCloudflareKvStore>[0]
}

const runtimeFetch: typeof fetch = async (input, init) => {
  const url = input instanceof Request ? input.url : String(input)
  if (url === 'https://provider.example/subscription') {
    return new Response(
      'proxies:\n  - name: Worker Demo\n    type: ss\n    server: example.com\n    port: 443\n    cipher: aes-128-gcm\n    password: secret\n',
      {
        headers: {
          'subscription-userinfo':
            'upload=1; download=2; total=100; expire=2000000000',
        },
      },
    )
  }
  if (url === 'https://rules.example/list') {
    return new Response('DOMAIN,example.com')
  }
  return fetch(input, init)
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const cache = new TtlCache()
    cache.useStore(createCloudflareKvStore(env.SURGIO_CACHE))
    const url = new URL(request.url)

    if (url.pathname === '/environment') {
      return new Response(readEnv('SURGIO_ENV_TEST'))
    }

    if (url.pathname === '/cache') {
      await cache.set(
        'worker-value',
        {
          buffer: Buffer.from('worker'),
          falsy: false,
        },
        60_000,
      )
      return Response.json(await cache.get('worker-value'))
    }

    const runtime = createSurgioRuntime(manifest, {
      cache,
      fetch: runtimeFetch,
      network: { artifactCacheTtl: 60_000 },
    })
    const result = await runtime.renderArtifact('demo.conf')
    return new Response(result.body, {
      headers: result.subscriptionUserInfo
        ? {
            'subscription-userinfo': Object.entries(result.subscriptionUserInfo)
              .map(([key, value]) => `${key}=${value}`)
              .join('; '),
          }
        : undefined,
    })
  },
}
