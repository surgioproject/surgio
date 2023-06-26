import test from 'ava'

import { NodeTypeEnum, VmessNodeConfig } from '../../types'
import * as filters from '../'
import { internalFilters } from '../'

const nodeConfigDefaults = {
  hostname: 'example.com',
  port: 443,
  method: 'chacha20-ietf-poly1305',
  password: 'password',
}

test('validateFilter', (t) => {
  t.false(filters.validateFilter(undefined))
  t.false(filters.validateFilter(null))
  t.true(
    filters.validateFilter(() => {
      return true
    }),
  )
  t.true(filters.validateFilter(filters.useSortedKeywords(['US'])))
})

test('useKeywords', (t) => {
  const fn1 = filters.useKeywords(['测试', 'test'])
  const fn2 = filters.useKeywords(['测试', 'test'], true)

  t.true(
    fn1({
      nodeName: '测试',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  )
  t.false(
    fn2({
      nodeName: '测试',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  )
  t.true(
    fn2({
      nodeName: '测试 test',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  )
})

test('discardKeywords', (t) => {
  const fn1 = filters.discardKeywords(['测试', 'test'])
  const fn2 = filters.discardKeywords(['测试', 'test'], true)

  t.false(
    fn1({
      nodeName: '测试',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  )
  t.true(
    fn1({
      nodeName: '美国',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  )
  t.true(
    fn2({
      nodeName: '测试',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  )
  t.true(
    fn2({
      nodeName: '美国测试',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  )
  t.false(
    fn2({
      nodeName: '测试 test',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  )
})

test('useRegexp', (t) => {
  const fn = filters.useRegexp(/(测试|test)/i)

  t.true(
    fn({
      nodeName: '测试',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  )
  t.false(
    fn({
      nodeName: '美国',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  )
})

test('useGlob', (t) => {
  let fn = filters.useGlob('测试*')

  t.true(
    fn({
      nodeName: '测试',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  )
  t.true(
    fn({
      nodeName: '测试节点',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  )
  t.false(
    fn({
      nodeName: '美国',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  )

  fn = filters.useGlob('(汉堡|薯条)')

  t.true(
    fn({
      nodeName: '两个汉堡',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  )
  t.true(
    fn({
      nodeName: '三个薯条',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  )
})

test('discardGlob', (t) => {
  let fn = filters.discardGlob('测试*')

  t.false(
    fn({
      nodeName: '测试',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  )
  t.false(
    fn({
      nodeName: '测试节点',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  )
  t.true(
    fn({
      nodeName: '美国',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  )

  fn = filters.discardGlob('(汉堡|薯条)')

  t.false(
    fn({
      nodeName: '两个汉堡',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  )
  t.true(
    fn({
      nodeName: '无限堡薯',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  )
})

test('netflixFilter', (t) => {
  t.true(
    internalFilters.netflixFilter({
      nodeName: 'hkbn 1',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  )
  t.true(
    internalFilters.netflixFilter({
      nodeName: 'HKBN 1',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  )
  t.false(
    internalFilters.netflixFilter({
      nodeName: 'HK',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  )
  t.true(
    internalFilters.netflixFilter({
      nodeName: 'HK NF',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  )
  t.true(
    internalFilters.netflixFilter({
      nodeName: 'HK Netflix',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  )
})

test('youtubePremiumFilter', (t) => {
  t.true(
    internalFilters.youtubePremiumFilter({
      nodeName: '🇺🇸 美国',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  )
  t.true(
    internalFilters.youtubePremiumFilter({
      nodeName: '韩国',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  )
  t.true(
    internalFilters.youtubePremiumFilter({
      nodeName: 'HK',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  )
})

test('usFilter', (t) => {
  t.true(
    internalFilters.usFilter({
      nodeName: '🇺🇸 美国',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  )
  t.false(
    internalFilters.usFilter({
      nodeName: 'HK',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  )
})

test('hkFilter', (t) => {
  t.true(
    internalFilters.hkFilter({
      nodeName: '🇭🇰',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  )
  t.true(
    internalFilters.hkFilter({
      nodeName: 'HK',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  )
  t.false(
    internalFilters.hkFilter({
      nodeName: 'US 1',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  )
})

test('japanFilter', (t) => {
  t.true(
    internalFilters.japanFilter({
      nodeName: '🇯🇵',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  )
  t.true(
    internalFilters.japanFilter({
      nodeName: 'JP',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  )
  t.false(
    internalFilters.japanFilter({
      nodeName: 'US 1',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  )
})

test('koreaFilter', (t) => {
  t.true(
    internalFilters.koreaFilter({
      nodeName: '🇰🇷',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  )
  t.true(
    internalFilters.koreaFilter({
      nodeName: '韩国',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  )
  t.false(
    internalFilters.koreaFilter({
      nodeName: 'US 1',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  )
})

test('singaporeFilter', (t) => {
  t.true(
    internalFilters.singaporeFilter({
      nodeName: '🇸🇬',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  )
  t.true(
    internalFilters.singaporeFilter({
      nodeName: '新加坡',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  )
  t.false(
    internalFilters.singaporeFilter({
      nodeName: 'US 1',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  )
})

test('taiwanFilter', (t) => {
  t.true(
    internalFilters.taiwanFilter({
      nodeName: '🇹🇼',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  )
  t.true(
    internalFilters.taiwanFilter({
      nodeName: '台湾',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  )
  t.false(
    internalFilters.taiwanFilter({
      nodeName: 'US 1',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  )
})

test('chinaBackFilter', (t) => {
  t.true(
    internalFilters.chinaBackFilter({
      nodeName: '回国',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  )
  t.true(
    internalFilters.chinaBackFilter({
      nodeName: '中国上海',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  )
  t.false(
    internalFilters.chinaBackFilter({
      nodeName: 'US 1',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  )
})

test('chinaOutFilter', (t) => {
  t.false(
    internalFilters.chinaOutFilter({
      nodeName: '回国',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  )
  t.false(
    internalFilters.chinaOutFilter({
      nodeName: '中国上海',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  )
  t.true(
    internalFilters.chinaOutFilter({
      nodeName: 'US 1',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  )
})

test('useSortedKeywords', (t) => {
  const fn = filters.useSortedKeywords(['test', '测试'])
  const result = fn.filter([
    generateVmessNode('测试 1'),
    generateVmessNode('测试 2'),
    generateVmessNode('测试 3'),
    generateVmessNode('test 测试 1'),
    generateVmessNode('test 2'),
    generateVmessNode('🇺🇸US 1'),
  ])

  t.true(fn.supportSort)
  t.deepEqual(result, [
    generateVmessNode('test 测试 1'),
    generateVmessNode('test 2'),
    generateVmessNode('测试 1'),
    generateVmessNode('测试 2'),
    generateVmessNode('测试 3'),
  ])
})

test('mergeSortedFilters 1', (t) => {
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

  t.true(fn.supportSort)
  t.deepEqual(result, [
    generateVmessNode('HK 1'),
    generateVmessNode('HK 2'),
    generateVmessNode('US 1'),
    generateVmessNode('US 2'),
  ])
})

test('mergeSortedFilters 2', (t) => {
  t.throws(() => {
    const fn = filters.useSortedKeywords(['1'])
    filters.mergeSortedFilters([fn as any])
  })

  t.throws(() => {
    // @ts-ignore
    filters.mergeSortedFilters([undefined])
  })
})

test('mergeFilters', (t) => {
  t.throws(() => {
    const fn = filters.useSortedKeywords(['1'])
    filters.mergeFilters([fn as any])
  })

  t.throws(() => {
    // @ts-ignore
    filters.mergeFilters([undefined])
  })
})

test('complicated mergeFilters', (t) => {
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

  t.is(
    fn({
      provider: { name: 'foo' } as any,
      type: NodeTypeEnum.Shadowsocks,
      nodeName: 'test',
      ...nodeConfigDefaults,
    }),
    true,
  )
  t.is(
    fn({
      provider: { name: 'foo2' } as any,
      type: NodeTypeEnum.Shadowsocks,
      nodeName: 'test',
      ...nodeConfigDefaults,
    }),
    false,
  )
  t.is(
    fn({
      provider: { name: 'foo' } as any,
      type: NodeTypeEnum.Shadowsocks,
      nodeName: 'should be false',
      ...nodeConfigDefaults,
    }),
    false,
  )
  t.is(
    fn({
      provider: { name: 'foo' } as any,
      type: NodeTypeEnum.Shadowsocks,
      nodeName: 'should be true test',
      ...nodeConfigDefaults,
    }),
    true,
  )
  t.is(
    fn({
      provider: { name: 'bar' } as any,
      type: NodeTypeEnum.Shadowsocks,
      nodeName: 'test',
      ...nodeConfigDefaults,
    }),
    true,
  )
  t.is(
    fn({
      provider: { name: 'bar2' } as any,
      type: NodeTypeEnum.Shadowsocks,
      nodeName: 'test',
      ...nodeConfigDefaults,
    }),
    false,
  )
})

test('useProviders', (t) => {
  const fn = filters.useProviders(['测试', 'test'], false)
  const fn2 = filters.useProviders(['测试', 'test'])

  t.is(
    fn({
      ...generateVmessNode('test'),
      provider: { name: '测试 asdf' },
    } as any),
    true,
  )
  t.is(
    fn({
      ...generateVmessNode('test'),
      provider: { name: 'test asdf' },
    } as any),
    true,
  )
  t.is(
    fn({
      ...generateVmessNode('test'),
      provider: { name: 'other' },
    } as any),
    false,
  )

  t.is(
    fn2({
      ...generateVmessNode('test'),
      provider: { name: '测试 asdf' },
    } as any),
    false,
  )
  t.is(
    fn2({
      ...generateVmessNode('test'),
      provider: { name: 'test asdf' },
    } as any),
    false,
  )
  t.is(
    fn2({
      ...generateVmessNode('test'),
      provider: { name: 'test' },
    } as any),
    true,
  )
})

test('discardProviders', (t) => {
  const fn = filters.discardProviders(['测试', 'test'], false)
  const fn2 = filters.discardProviders(['测试', 'test'])

  t.is(
    fn({
      ...generateVmessNode('test'),
      provider: { name: '测试 asdf' },
    } as any),
    false,
  )
  t.is(
    fn({
      ...generateVmessNode('test'),
      provider: { name: 'test asdf' },
    } as any),
    false,
  )
  t.is(
    fn({
      ...generateVmessNode('test'),
      provider: { name: 'other' },
    } as any),
    true,
  )

  t.is(
    fn2({
      ...generateVmessNode('test'),
      provider: { name: 'test' },
    } as any),
    false,
  )
  t.is(
    fn2({
      ...generateVmessNode('test'),
      provider: { name: 'test asdf' },
    } as any),
    true,
  )
  t.is(
    fn2({
      ...generateVmessNode('test'),
      provider: { name: 'other' },
    } as any),
    true,
  )
})

test('reverseFilter', (t) => {
  const notUS = filters.reverseFilter(internalFilters.usFilter)
  const notUSAndNotBGP = filters.mergeReversedFilters(
    [notUS, filters.discardKeywords(['BGP'])],
    true,
  )
  const notUSOrNotBGP = filters.mergeReversedFilters(
    [notUS, filters.discardKeywords(['BGP'])],
    false,
  )

  t.true(
    notUS({
      nodeName: '台湾',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  )
  t.false(
    notUS({
      nodeName: '美国',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  )

  t.true(
    notUSAndNotBGP({
      nodeName: '香港BGP',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  )
  t.false(
    notUSAndNotBGP({
      nodeName: '芝加哥BGP',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  )
  t.true(
    notUSAndNotBGP({
      nodeName: '芝加哥IPLC',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  )
  t.true(
    notUSAndNotBGP({
      nodeName: '韩国',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  )

  t.false(
    notUSOrNotBGP({
      nodeName: '香港BGP',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  )
  t.false(
    notUSOrNotBGP({
      nodeName: '芝加哥BGP',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  )
  t.false(
    notUSOrNotBGP({
      nodeName: '芝加哥IPLC',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  )
  t.true(
    notUSOrNotBGP({
      nodeName: '韩国',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  )
})

function generateVmessNode(nodeName: string): VmessNodeConfig {
  return {
    type: NodeTypeEnum.Vmess,
    alterId: '64',
    hostname: '1.1.1.1',
    method: 'auto',
    network: 'tcp',
    nodeName,
    path: '/',
    port: 8080,
    tls: false,
    host: '',
    uuid: '1386f85e-657b-4d6e-9d56-78badb75e1fd',
  }
}
