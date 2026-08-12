import { beforeAll, expect, test } from 'vitest'

import { addFlagMap, prependFlag, removeFlag } from '../flag'

beforeAll(() => {
  addFlagMap(/foobar/i, '🚀')
  addFlagMap('多伦多', '🇨🇦')
  addFlagMap(/sri\slanka/i, '🇱🇰')
  addFlagMap(/sri\slanka/i, '🇱🇰')
  addFlagMap('镇江', '🏁')
})

test('prependFlag', () => {
  expect(prependFlag('美国')).toBe('🇺🇸 美国')
  expect(prependFlag('上海美国')).toBe('🇺🇸 上海美国')
  expect(prependFlag('美国上海')).toBe('🇺🇸 美国上海')
  expect(prependFlag('阿联酋')).toBe('🇦🇪 阿联酋')
  expect(prependFlag('US')).toBe('🇺🇸 US')
  expect(prependFlag('us')).toBe('🇺🇸 us')
  expect(prependFlag('uk plus')).toBe('🇬🇧 uk plus')
  expect(prependFlag('英国 Plus')).toBe('🇬🇧 英国 Plus')
  expect(prependFlag('UsA-Node')).toBe('🇺🇸 UsA-Node')
  expect(prependFlag('香港_HK')).toBe('🇭🇰 香港_HK')
  expect(prependFlag('新加坡.sg')).toBe('🇸🇬 新加坡.sg')
  expect(prependFlag('日本|JP|')).toBe('🇯🇵 日本|JP|')
  expect(prependFlag('台湾.TWN')).toBe('🇨🇳 台湾.TWN')
  expect(prependFlag('德国Frankfurt')).toBe('🇩🇪 德国Frankfurt')
  expect(prependFlag('🇺🇸 jp')).toBe('🇺🇸 jp')
  expect(prependFlag('🇯🇵 US')).toBe('🇯🇵 US')
  expect(prependFlag('🇺🇸 jp', true)).toBe('🇯🇵 jp')
  expect(prependFlag('🇯🇵 🇺🇸 jp', true)).toBe('🇯🇵 jp')
  expect(prependFlag('🇺🇸 🇯🇵 US', true)).toBe('🇺🇸 US')
  expect(prependFlag('foobar 节点')).toBe('🚀 foobar 节点')
  expect(prependFlag('上海 - 多伦多')).toBe('🇨🇦 上海 - 多伦多')
  expect(prependFlag('上海 - Sri Lanka')).toBe('🇱🇰 上海 - Sri Lanka')
  expect(prependFlag('镇江 - Sri Lanka')).toBe('🇱🇰 镇江 - Sri Lanka')
  expect(prependFlag('镇江')).toBe('🏁 镇江')
})

test('removeFlag', () => {
  expect(removeFlag('🇺🇸 jp')).toBe('jp')
  expect(removeFlag('🇺🇸 🇺🇸 jp')).toBe('jp')
  expect(removeFlag('🇭🇰 香港节点')).toBe('香港节点')
  expect(removeFlag('🇯🇵 🇺🇸 东京')).toBe('东京')
  expect(removeFlag('🚀 测试节点')).toBe('测试节点')
  expect(removeFlag('节点 🇨🇳')).toBe('节点')
  expect(removeFlag('🇸🇬 新加坡 🇸🇬')).toBe('新加坡')
})
