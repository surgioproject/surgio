import { expect, test } from 'vitest'

import { NodeTypeEnum, VmessNodeConfig } from '../../types'
import * as filters from '../'
import { internalFilters } from '../'

const nodeConfigDefaults = {
  hostname: 'example.com',
  port: 443,
  method: 'chacha20-ietf-poly1305',
  password: 'password',
}

test('validateFilter', () => {
  expect(filters.validateFilter(undefined)).toBe(false)
  expect(filters.validateFilter(null)).toBe(false)
  expect(
    filters.validateFilter(() => {
      return true
    }),
  ).toBe(true)
  expect(filters.validateFilter(filters.useSortedKeywords(['US']))).toBe(true)
})

test('tailscaleFilter', () => {
  expect(
    internalFilters.tailscaleFilter({
      type: NodeTypeEnum.Tailscale,
      nodeName: 'tailnet',
    }),
  ).toBe(true)
  expect(
    internalFilters.tailscaleFilter({
      type: NodeTypeEnum.Shadowsocks,
      nodeName: 'shadowsocks',
      ...nodeConfigDefaults,
    }),
  ).toBe(false)
})

test('useKeywords', () => {
  const fn1 = filters.useKeywords(['测试', 'test'])
  const fn2 = filters.useKeywords(['测试', 'test'], true)

  expect(
    fn1({
      nodeName: '测试',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  ).toBe(true)
  expect(
    fn2({
      nodeName: '测试',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  ).toBe(false)
  expect(
    fn2({
      nodeName: '测试 test',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  ).toBe(true)
})

test('discardKeywords', () => {
  const fn1 = filters.discardKeywords(['测试', 'test'])
  const fn2 = filters.discardKeywords(['测试', 'test'], true)

  expect(
    fn1({
      nodeName: '测试',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  ).toBe(false)
  expect(
    fn1({
      nodeName: '美国',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  ).toBe(true)
  expect(
    fn2({
      nodeName: '测试',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  ).toBe(true)
  expect(
    fn2({
      nodeName: '美国测试',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  ).toBe(true)
  expect(
    fn2({
      nodeName: '测试 test',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  ).toBe(false)
})

test('useRegexp', () => {
  const fn = filters.useRegexp(/(测试|test)/i)

  expect(
    fn({
      nodeName: '测试',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  ).toBe(true)
  expect(
    fn({
      nodeName: '美国',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  ).toBe(false)
})

test('useGlob', () => {
  let fn = filters.useGlob('测试*')

  expect(
    fn({
      nodeName: '测试',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  ).toBe(true)
  expect(
    fn({
      nodeName: '测试节点',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  ).toBe(true)
  expect(
    fn({
      nodeName: '美国',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  ).toBe(false)

  fn = filters.useGlob('(汉堡|薯条)')

  expect(
    fn({
      nodeName: '两个汉堡',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  ).toBe(true)
  expect(
    fn({
      nodeName: '三个薯条',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  ).toBe(true)
})

test('discardGlob', () => {
  let fn = filters.discardGlob('测试*')

  expect(
    fn({
      nodeName: '测试',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  ).toBe(false)
  expect(
    fn({
      nodeName: '测试节点',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  ).toBe(false)
  expect(
    fn({
      nodeName: '美国',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  ).toBe(true)

  fn = filters.discardGlob('(汉堡|薯条)')

  expect(
    fn({
      nodeName: '两个汉堡',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  ).toBe(false)
  expect(
    fn({
      nodeName: '无限堡薯',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  ).toBe(true)
})

test('netflixFilter', () => {
  expect(
    internalFilters.netflixFilter({
      nodeName: 'hkbn 1',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  ).toBe(true)
  expect(
    internalFilters.netflixFilter({
      nodeName: 'HKBN 1',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  ).toBe(true)
  expect(
    internalFilters.netflixFilter({
      nodeName: 'HK',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  ).toBe(false)
  expect(
    internalFilters.netflixFilter({
      nodeName: 'HK NF',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  ).toBe(true)
  expect(
    internalFilters.netflixFilter({
      nodeName: 'HK Netflix',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  ).toBe(true)
})

test('youtubePremiumFilter', () => {
  expect(
    internalFilters.youtubePremiumFilter({
      nodeName: '🇺🇸 美国',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  ).toBe(true)
  expect(
    internalFilters.youtubePremiumFilter({
      nodeName: '韩国',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  ).toBe(true)
  expect(
    internalFilters.youtubePremiumFilter({
      nodeName: 'HK',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  ).toBe(true)
})

test('usFilter', () => {
  expect(
    internalFilters.usFilter({
      nodeName: '🇺🇸 美国',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  ).toBe(true)
  expect(
    internalFilters.usFilter({
      nodeName: 'HK',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  ).toBe(false)
})

test('hkFilter', () => {
  expect(
    internalFilters.hkFilter({
      nodeName: '🇭🇰',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  ).toBe(true)
  expect(
    internalFilters.hkFilter({
      nodeName: 'HK',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  ).toBe(true)
  expect(
    internalFilters.hkFilter({
      nodeName: 'US 1',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  ).toBe(false)
})

test('japanFilter', () => {
  expect(
    internalFilters.japanFilter({
      nodeName: '🇯🇵',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  ).toBe(true)
  expect(
    internalFilters.japanFilter({
      nodeName: 'JP',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  ).toBe(true)
  expect(
    internalFilters.japanFilter({
      nodeName: 'US 1',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  ).toBe(false)
})

test('koreaFilter', () => {
  expect(
    internalFilters.koreaFilter({
      nodeName: '🇰🇷',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  ).toBe(true)
  expect(
    internalFilters.koreaFilter({
      nodeName: '韩国',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  ).toBe(true)
  expect(
    internalFilters.koreaFilter({
      nodeName: 'US 1',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  ).toBe(false)
})

test('singaporeFilter', () => {
  expect(
    internalFilters.singaporeFilter({
      nodeName: '🇸🇬',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  ).toBe(true)
  expect(
    internalFilters.singaporeFilter({
      nodeName: '新加坡',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  ).toBe(true)
  expect(
    internalFilters.singaporeFilter({
      nodeName: 'US 1',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  ).toBe(false)
})

test('taiwanFilter', () => {
  expect(
    internalFilters.taiwanFilter({
      nodeName: '🇹🇼',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  ).toBe(true)
  expect(
    internalFilters.taiwanFilter({
      nodeName: '台湾',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  ).toBe(true)
  expect(
    internalFilters.taiwanFilter({
      nodeName: 'US 1',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  ).toBe(false)
})

test('chinaBackFilter', () => {
  expect(
    internalFilters.chinaBackFilter({
      nodeName: '回国',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  ).toBe(true)
  expect(
    internalFilters.chinaBackFilter({
      nodeName: '中国上海',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  ).toBe(true)
  expect(
    internalFilters.chinaBackFilter({
      nodeName: 'US 1',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  ).toBe(false)
})

test('chinaOutFilter', () => {
  expect(
    internalFilters.chinaOutFilter({
      nodeName: '回国',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  ).toBe(false)
  expect(
    internalFilters.chinaOutFilter({
      nodeName: '中国上海',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  ).toBe(false)
  expect(
    internalFilters.chinaOutFilter({
      nodeName: 'US 1',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  ).toBe(true)
})

test('useSortedKeywords', () => {
  const fn = filters.useSortedKeywords(['test', '测试'])
  const result = fn.filter([
    generateVmessNode('测试 1'),
    generateVmessNode('测试 2'),
    generateVmessNode('测试 3'),
    generateVmessNode('test 测试 1'),
    generateVmessNode('test 2'),
    generateVmessNode('🇺🇸US 1'),
  ])

  expect(fn.supportSort).toBe(true)
  expect(result).toEqual([
    generateVmessNode('test 测试 1'),
    generateVmessNode('test 2'),
    generateVmessNode('测试 1'),
    generateVmessNode('测试 2'),
    generateVmessNode('测试 3'),
  ])
})

test('mergeSortedFilters 1', () => {
  const fn = filters.mergeSortedFilters([
    internalFilters.hkFilter,
    internalFilters.usFilter,
  ])
  const result = fn.filter([
    generateVmessNode('US 1'),
    generateVmessNode('US 2'),
    generateVmessNode('HK 1'),
    generateVmessNode('HK 2'),
    generateVmessNode('test 1'),
  ])

  expect(fn.supportSort).toBe(true)
  expect(result).toEqual([
    generateVmessNode('HK 1'),
    generateVmessNode('HK 2'),
    generateVmessNode('US 1'),
    generateVmessNode('US 2'),
  ])
})

test('mergeSortedFilters 2', () => {
  expect(() => {
    const fn = filters.useSortedKeywords(['1'])
    filters.mergeSortedFilters([fn as any])
  }).toThrow()

  expect(() => {
    // @ts-ignore
    filters.mergeSortedFilters([undefined])
  }).toThrow()
})

test('mergeFilters', () => {
  expect(() => {
    const fn = filters.useSortedKeywords(['1'])
    filters.mergeFilters([fn as any])
  }).toThrow()

  expect(() => {
    // @ts-ignore
    filters.mergeFilters([undefined])
  }).toThrow()
})

test('complicated mergeFilters', () => {
  const fn = filters.mergeFilters([
    filters.mergeFilters(
      [filters.useKeywords(['test']), filters.useProviders(['foo'], true)],
      true,
    ),
    filters.mergeFilters(
      [filters.useKeywords(['test']), filters.useProviders(['bar'], true)],
      true,
    ),
  ])

  expect(
    fn({
      provider: { name: 'foo' } as any,
      type: NodeTypeEnum.Shadowsocks,
      nodeName: 'test',
      ...nodeConfigDefaults,
    }),
  ).toBe(true)
  expect(
    fn({
      provider: { name: 'foo2' } as any,
      type: NodeTypeEnum.Shadowsocks,
      nodeName: 'test',
      ...nodeConfigDefaults,
    }),
  ).toBe(false)
  expect(
    fn({
      provider: { name: 'foo' } as any,
      type: NodeTypeEnum.Shadowsocks,
      nodeName: 'should be false',
      ...nodeConfigDefaults,
    }),
  ).toBe(false)
  expect(
    fn({
      provider: { name: 'foo' } as any,
      type: NodeTypeEnum.Shadowsocks,
      nodeName: 'should be true test',
      ...nodeConfigDefaults,
    }),
  ).toBe(true)
  expect(
    fn({
      provider: { name: 'bar' } as any,
      type: NodeTypeEnum.Shadowsocks,
      nodeName: 'test',
      ...nodeConfigDefaults,
    }),
  ).toBe(true)
  expect(
    fn({
      provider: { name: 'bar2' } as any,
      type: NodeTypeEnum.Shadowsocks,
      nodeName: 'test',
      ...nodeConfigDefaults,
    }),
  ).toBe(false)
})

test('useProviders', () => {
  const fn = filters.useProviders(['测试', 'test'], false)
  const fn2 = filters.useProviders(['测试', 'test'])

  expect(
    fn({
      ...generateVmessNode('test'),
      provider: { name: '测试 asdf' },
    } as any),
  ).toBe(true)
  expect(
    fn({
      ...generateVmessNode('test'),
      provider: { name: 'test asdf' },
    } as any),
  ).toBe(true)
  expect(
    fn({
      ...generateVmessNode('test'),
      provider: { name: 'other' },
    } as any),
  ).toBe(false)

  expect(
    fn2({
      ...generateVmessNode('test'),
      provider: { name: '测试 asdf' },
    } as any),
  ).toBe(false)
  expect(
    fn2({
      ...generateVmessNode('test'),
      provider: { name: 'test asdf' },
    } as any),
  ).toBe(false)
  expect(
    fn2({
      ...generateVmessNode('test'),
      provider: { name: 'test' },
    } as any),
  ).toBe(true)
})

test('discardProviders', () => {
  const fn = filters.discardProviders(['测试', 'test'], false)
  const fn2 = filters.discardProviders(['测试', 'test'])

  expect(
    fn({
      ...generateVmessNode('test'),
      provider: { name: '测试 asdf' },
    } as any),
  ).toBe(false)
  expect(
    fn({
      ...generateVmessNode('test'),
      provider: { name: 'test asdf' },
    } as any),
  ).toBe(false)
  expect(
    fn({
      ...generateVmessNode('test'),
      provider: { name: 'other' },
    } as any),
  ).toBe(true)

  expect(
    fn2({
      ...generateVmessNode('test'),
      provider: { name: 'test' },
    } as any),
  ).toBe(false)
  expect(
    fn2({
      ...generateVmessNode('test'),
      provider: { name: 'test asdf' },
    } as any),
  ).toBe(true)
  expect(
    fn2({
      ...generateVmessNode('test'),
      provider: { name: 'other' },
    } as any),
  ).toBe(true)
})

test('reverseFilter', () => {
  const notUS = filters.reverseFilter(internalFilters.usFilter)
  const notUSAndNotBGP = filters.mergeReversedFilters(
    [notUS, filters.discardKeywords(['BGP'])],
    true,
  )
  const notUSOrNotBGP = filters.mergeReversedFilters(
    [notUS, filters.discardKeywords(['BGP'])],
    false,
  )

  expect(
    notUS({
      nodeName: '台湾',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  ).toBe(true)
  expect(
    notUS({
      nodeName: '美国',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  ).toBe(false)

  expect(
    notUSAndNotBGP({
      nodeName: '香港BGP',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  ).toBe(true)
  expect(
    notUSAndNotBGP({
      nodeName: '芝加哥BGP',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  ).toBe(false)
  expect(
    notUSAndNotBGP({
      nodeName: '芝加哥IPLC',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  ).toBe(true)
  expect(
    notUSAndNotBGP({
      nodeName: '韩国',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  ).toBe(true)

  expect(
    notUSOrNotBGP({
      nodeName: '香港BGP',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  ).toBe(false)
  expect(
    notUSOrNotBGP({
      nodeName: '芝加哥BGP',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  ).toBe(false)
  expect(
    notUSOrNotBGP({
      nodeName: '芝加哥IPLC',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  ).toBe(false)
  expect(
    notUSOrNotBGP({
      nodeName: '韩国',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  ).toBe(true)
})

function generateVmessNode(nodeName: string): VmessNodeConfig {
  return {
    type: NodeTypeEnum.Vmess,
    alterId: '64',
    hostname: '1.1.1.1',
    method: 'auto',
    network: 'tcp',
    nodeName,
    port: 8080,
    tls: false,
    uuid: '1386f85e-657b-4d6e-9d56-78badb75e1fd',
  }
}
