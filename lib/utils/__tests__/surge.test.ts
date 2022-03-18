import test from 'ava';

import * as surge from '../surge';

test('getSurgeExtendHeaders', (t) => {
  t.is(
    surge.getSurgeExtendHeaders({
      foo: 'bar',
      'multi words key': 'multi words value',
    }),
    'foo:bar|multi words key:multi words value',
  );
});
