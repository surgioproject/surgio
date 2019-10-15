import test from 'ava';
import { prependFlag } from '../../lib/utils/flag';

test('addFlag', t => {
  t.is(prependFlag('美国'), '🇺🇲 美国');
  t.is(prependFlag('阿联酋'), '阿联酋');
  t.is(prependFlag('US'), '🇺🇲 US');
  t.is(prependFlag('us'), '🇺🇲 us');
  t.is(prependFlag('🇺🇲 jp'), '🇺🇲 jp');
  t.is(prependFlag('🇯🇵 US'), '🇯🇵 US');
});
