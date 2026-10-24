import { expect, test, vi } from 'vitest'

import { NodeTypeEnum } from '../../types.js'
import { getLoonNodes, getLoonNodeNames } from '../loon.js'

import type { PossibleNodeConfigType } from '../../types.js'

const base = { nodeName: 'test', hostname: 'example.com', port: 443 }
const uuid = '1386f85e-657b-4d6e-9d56-78badb75e1fd'

test.each(['Host', 'host', 'HOST'])('Trojan WebSocket header %s', (header) => {
  const logger = {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }
  expect(
    getLoonNodes(
      [
        {
          ...base,
          type: NodeTypeEnum.Trojan,
          password: 'password',
          network: 'ws',
          wsHeaders: { [header]: 'cdn.example.com' },
        },
      ],
      undefined,
      { logger },
    ),
  ).toContain('transport=ws,path=/,host=cdn.example.com')
  expect(logger.warn).not.toHaveBeenCalled()
})

test.each([NodeTypeEnum.HTTP, NodeTypeEnum.HTTPS] as const)(
  'quote %s usernames',
  (type) => {
    expect(
      getLoonNodes([
        { ...base, type, username: 'user,name', password: 'password' },
      ]),
    ).toContain(',"user,name","password"')
    expect(
      getLoonNodes([
        { ...base, type, username: 'user"name', password: 'password' },
      ]),
    ).toContain(',"user\\"name","password"')
  },
)

test.each(['0', '64', undefined])('preserve VMess alterId %s', (alterId) => {
  const output = getLoonNodes([
    {
      ...base,
      type: NodeTypeEnum.Vmess,
      uuid,
      method: 'auto',
      network: 'tcp',
      alterId,
    },
  ])
  if (alterId === undefined) expect(output).not.toContain('alterId=')
  else expect(output).toContain(`alterId=${alterId}`)
})

test('node names match supported node output before sorting and filtering', () => {
  const nodes: PossibleNodeConfigType[] = [
    {
      ...base,
      type: NodeTypeEnum.Vmess,
      nodeName: 'grpc',
      uuid,
      method: 'auto',
      network: 'grpc',
    },
    {
      ...base,
      type: NodeTypeEnum.Vless,
      nodeName: 'h2',
      uuid,
      method: 'none',
      network: 'h2',
    },
    {
      ...base,
      type: NodeTypeEnum.Shadowsocks,
      nodeName: 'obfs',
      method: 'aes-128-gcm',
      password: 'password',
      obfs: 'ws',
    },
    { ...base, type: NodeTypeEnum.HTTP, nodeName: 'a' },
    { ...base, type: NodeTypeEnum.HTTPS, nodeName: 'b' },
  ]
  expect(getLoonNodeNames(nodes)).toBe('a, b')
  expect(getLoonNodeNames(nodes, (node) => node.nodeName === 'b')).toBe('b')
  expect(
    getLoonNodeNames(
      nodes,
      { supportSort: true, filter: (list) => [...list].reverse() },
      '|',
    ),
  ).toBe('b|a')
  expect(
    getLoonNodes(nodes)
      .split('\n')
      .map((line) => line.split(' = ')[0]),
  ).toEqual(['a', 'b'])
})
