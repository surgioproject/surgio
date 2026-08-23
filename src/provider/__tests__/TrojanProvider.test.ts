import { beforeEach, expect, test, vi } from 'vitest'

import * as config from '../../config.js'
import { NodeTypeEnum, SupportProviderEnum } from '../../types.js'
import { toBase64, toUrlSafeBase64 } from '../../utils/portable.js'
import Provider from '../Provider.js'
import TrojanProvider from '../TrojanProvider.js'

beforeEach(() => {
  vi.restoreAllMocks()
  vi.spyOn(config, 'getConfig').mockReturnValue({} as any)
})

test('TrojanProvider delegates subscription decoding to the v2rayN parser', async () => {
  const subscriptionUserInfo = {
    upload: 1,
    download: 2,
    total: 3,
    expire: 4,
  }
  const request = vi
    .spyOn(Provider, 'requestCacheableResource')
    .mockResolvedValue({
      body: toBase64(
        [
          `ss://${toUrlSafeBase64('aes-128-gcm:password')}@ss.example.com:8388#SS`,
          'trojan://password@trojan.example.com:443?type=ws&host=cdn.example.com&path=%2Ftrojan&sni=trojan.example.com#Trojan',
        ].join('\n'),
      ),
      subscriptionUserInfo,
    })
  const provider = new TrojanProvider('trojan', {
    type: SupportProviderEnum.Trojan,
    url: 'https://example.com/subscription',
    udpRelay: true,
    tls13: true,
  })

  const result = await provider.getNodeListV2()

  expect(result).toMatchObject({
    subscriptionUserInfo,
    nodeList: [
      {
        type: NodeTypeEnum.Trojan,
        nodeName: 'Trojan',
        hostname: 'trojan.example.com',
        network: 'ws',
        wsPath: '/trojan',
        wsHeaders: { Host: 'cdn.example.com' },
        udpRelay: true,
        tls13: true,
      },
    ],
  })
  expect(request).toHaveBeenCalledOnce()
  expect(request.mock.calls[0][1]).toMatchObject({
    'user-agent': expect.stringContaining('shadowrocket'),
  })
})
