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
})
