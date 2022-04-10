import test from 'ava';

import httpClient, { getUserAgent } from '../http-client';

test('getUserAgent', (t) => {
  const pkg = require('../../../package.json');
  t.is(getUserAgent(), 'surgio/' + pkg.version);
  t.is(getUserAgent('foo'), 'foo surgio/' + pkg.version);
});

test('httpClient', (t) => {
  const pkg = require('../../../package.json');
  t.is(
    httpClient.defaults.options.headers['user-agent'],
    'surgio/' + pkg.version,
  );
});
