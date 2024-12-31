import test from 'ava'

import { addFlagMap, prependFlag, removeFlag } from '../flag'

test.before(() => {
  addFlagMap(/foobar/i, '🚀')
  addFlagMap('多伦多', '🇨🇦')
  addFlagMap(/sri\slanka/i, '🇱🇰')
  addFlagMap(/sri\slanka/i, '🇱🇰')
  addFlagMap('镇江', '🏁')
})

test('prependFlag', (t) => {
  t.is(prependFlag('美国'), '🇺🇸 美国')
  t.is(prependFlag('上海美国'), '🇺🇸 上海美国')
  t.is(prependFlag('美国上海'), '🇺🇸 美国上海')
  t.is(prependFlag('阿联酋'), '🇦🇪 阿联酋')
  t.is(prependFlag('US'), '🇺🇸 US')
  t.is(prependFlag('us'), '🇺🇸 us')
  t.is(prependFlag('uk plus'), '🇬🇧 uk plus')
  t.is(prependFlag('英国 Plus'), '🇬🇧 英国 Plus')
  t.is(prependFlag('UsA-Node'), '🇺🇸 UsA-Node')
  t.is(prependFlag('香港_HK'), '🇭🇰 香港_HK')
  t.is(prependFlag('新加坡.sg'), '🇸🇬 新加坡.sg')
  t.is(prependFlag('日本|JP|'), '🇯🇵 日本|JP|')
  t.is(prependFlag('台湾.TWN'), '🇨🇳 台湾.TWN')
  t.is(prependFlag('德国Frankfurt'), '🇩🇪 德国Frankfurt')
  t.is(prependFlag('🇺🇸 jp'), '🇺🇸 jp')
  t.is(prependFlag('🇯🇵 US'), '🇯🇵 US')
  t.is(prependFlag('🇺🇸 jp', true), '🇯🇵 jp')
  t.is(prependFlag('🇯🇵 🇺🇸 jp', true), '🇯🇵 jp')
  t.is(prependFlag('🇺🇸 🇯🇵 US', true), '🇺🇸 US')
  t.is(prependFlag('foobar 节点'), '🚀 foobar 节点')
  t.is(prependFlag('上海 - 多伦多'), '🇨🇦 上海 - 多伦多')
  t.is(prependFlag('上海 - Sri Lanka'), '🇱🇰 上海 - Sri Lanka')
  t.is(prependFlag('镇江 - Sri Lanka'), '🇱🇰 镇江 - Sri Lanka')
  t.is(prependFlag('镇江'), '🏁 镇江')
})

test('removeFlag', (t) => {
  t.is(removeFlag('🇺🇸 jp'), 'jp')
  t.is(removeFlag('🇺🇸 🇺🇸 jp'), 'jp')
  t.is(removeFlag('🇭🇰 香港节点'), '香港节点')
  t.is(removeFlag('🇯🇵 🇺🇸 东京'), '东京')
  t.is(removeFlag('🚀 测试节点'), '测试节点')
  t.is(removeFlag('节点 🇨🇳'), '节点')
  t.is(removeFlag('🇸🇬 新加坡 🇸🇬'), '新加坡')
})
