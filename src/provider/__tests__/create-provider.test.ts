import { expect, test } from 'vitest'

import { getDefaultProviderRuntimeContext } from '../../runtime/provider-context.js'
import { createProvider } from '../create-provider.js'

test('rejects the removed SSD provider type', async () => {
  await expect(
    createProvider(
      'legacy-ssd',
      { type: 'ssd' } as never,
      getDefaultProviderRuntimeContext(),
    ),
  ).rejects.toThrow('Unsupported provider type: ssd')
})
