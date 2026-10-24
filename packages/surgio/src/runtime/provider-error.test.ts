import { expect, test } from 'vitest'

import { SurgioError } from '../utils/errors.js'

import { withProviderError } from './provider-error.js'

test.each([undefined, 'provider/test.js'])(
  'wraps rejection with provider context and path %s',
  async (providerPath) => {
    for (const cause of [new Error('download failed'), 'rejected']) {
      const error = await withProviderError(
        { providerName: 'test', providerPath },
        () => Promise.reject(cause),
      ).catch((error: unknown) => error)

      expect(error).toBeInstanceOf(SurgioError)
      expect(error).toMatchObject({
        message:
          cause instanceof Error ? 'download failed' : '处理 Provider 失败',
        cause,
        providerName: 'test',
        providerPath,
      })
    }
  },
)

test.each([undefined, 'test.js'])(
  'replaces nested provider metadata with path %s',
  async (providerPath) => {
    const cause = new Error('invalid node')
    const error = new SurgioError('provider failed', {
      cause,
      providerName: 'original',
      providerPath: 'original.js',
      nodeIndex: 2,
    })

    await expect(
      withProviderError({ providerName: 'test', providerPath }, () =>
        Promise.reject(error),
      ),
    ).rejects.toBe(error)
    expect(error).toMatchObject({
      providerName: 'test',
      providerPath,
      cause,
      nodeIndex: 2,
    })
  },
)

test('wraps synchronous task failures', async () => {
  const cause = new Error('load failed')

  await expect(
    withProviderError({ providerName: 'test' }, () => {
      throw cause
    }),
  ).rejects.toMatchObject({
    message: 'load failed',
    cause,
    providerName: 'test',
  })
})
