import { expect, test, vi } from 'vitest'

import { NodeTypeEnum } from '../types.js'

import { formatProviderNodes } from './format.js'

test('rejects the removed Shadowsocks JSON output format', () => {
  expect(() => formatProviderNodes('shadowsocks-json' as never, [])).toThrow(
    'Unsupported provider format: shadowsocks-json',
  )
})

test('passes the runtime logger to the v2rayN formatter', () => {
  const warn = vi.fn()
  const output = formatProviderNodes(
    'v2rayn',
    [
      {
        type: NodeTypeEnum.Hysteria2,
        nodeName: 'lossy node',
        hostname: 'hy2.example.com',
        port: 443,
        password: 'password',
        uploadBandwidth: 100,
      },
    ],
    undefined,
    {
      logger: {
        debug: vi.fn(),
        info: vi.fn(),
        warn,
        error: vi.fn(),
      },
    },
  )

  expect(output).toContain('hysteria2://')
  expect(warn).toHaveBeenCalledWith(expect.stringContaining('uploadBandwidth'))
})
