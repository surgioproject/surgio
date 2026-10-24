import ky from 'ky'

import packageJson from '../../package.json' with { type: 'json' }
import { getNetworkRetry, getNetworkTimeout } from '../utils/env-flag.js'

import { getRuntimeUserAgent } from './user-agent.js'

import type {
  RuntimeHeaders,
  RuntimeHttpClient,
  RuntimeHttpResponse,
} from './types.js'

export interface HttpClientOptions {
  fetch?: typeof globalThis.fetch
  headers?: RuntimeHeaders
  retry?: number
  timeout?: number
}

const createHeaders = (values: RuntimeHeaders = {}): Headers => {
  const headers = new Headers()
  for (const [key, value] of Object.entries(values)) {
    if (Array.isArray(value)) {
      for (const item of value) headers.append(key, item)
    } else if (value !== undefined) {
      headers.set(key, value)
    }
  }
  return headers
}

const normalizeHeaders = (headers: Headers): RuntimeHeaders =>
  Object.fromEntries(headers.entries())

export const createHttpClient = (
  options: HttpClientOptions = {},
): RuntimeHttpClient => {
  const client = ky.create({
    fetch: (options.fetch ?? globalThis.fetch).bind(globalThis),
    headers: createHeaders({
      'user-agent': getRuntimeUserAgent(undefined, packageJson.version),
      ...options.headers,
    }),
    retry: {
      limit: Math.max(0, options.retry ?? 2),
      retryOnTimeout: true,
    },
    timeout: options.timeout ?? 10_000,
  })

  return {
    async get(url, requestOptions = {}): Promise<RuntimeHttpResponse> {
      const response = await client.get(url, {
        headers: createHeaders(requestOptions.headers),
      })

      return {
        body: await response.text(),
        headers: normalizeHeaders(response.headers),
        statusCode: response.status,
      }
    },
  }
}

export const httpClient: RuntimeHttpClient = createHttpClient({
  retry: getNetworkRetry(),
  timeout: getNetworkTimeout(),
})
