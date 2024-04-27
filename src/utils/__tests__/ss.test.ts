import test from 'ava'

import { NodeTypeEnum } from '../../types'
import { parseSSUri, stringifySip003Options } from '../ss'

test('parseSSUri', (t) => {
  t.deepEqual(
    parseSSUri(
      'ss://Y2hhY2hhMjAtaWV0ZjpwYXNzd29yZA==@example.com:12345/?plugin=simple-obfs%3Bobfs%3Dhttp%3Bobfs-host%3Dexample.com#%E6%B5%8B%E8%AF%95%E8%8A%82%E7%82%B9',
    ),
    {
      hostname: 'example.com',
      method: 'chacha20-ietf',
      nodeName: '测试节点',
      password: 'password',
      port: '12345',
      type: NodeTypeEnum.Shadowsocks,
      obfs: 'http',
      obfsHost: 'example.com',
    },
  )
})

test('stringifySip003Options', (t) => {
  t.is(
    stringifySip003Options({
      a: 123,
      host: 'https://a.com/foo?bar=baz&q\\q=1&w;w=2',
      mode: 'quic',
      tls: true,
    }),
    'a=123;host=https://a.com/foo?bar\\=baz&q\\\\q\\=1&w\\;w\\=2;mode=quic;tls=true',
  )
  t.is(stringifySip003Options({}), '')
  t.is(stringifySip003Options(), '')
})
