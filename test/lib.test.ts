import test from 'ava'
import * as surgio from '../'

test('library', (t) => {
  t.true(surgio.hasOwnProperty('utils'))
  t.true(surgio.hasOwnProperty('pkg'))
  t.true(surgio.utils.hasOwnProperty('mergeFilters'))
  t.true(surgio.utils.hasOwnProperty('useKeywords'))
  t.true(surgio.utils.hasOwnProperty('useRegexp'))
})
