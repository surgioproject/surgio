import sinon from 'sinon';
import test from 'ava';
import MockRedis from 'ioredis-mock';

import { RedisCache } from '../cache';
import redis from '../../redis';

const sandbox = sinon.createSandbox();

test.before(() => {
  sandbox.stub(redis, 'getRedis').returns(new MockRedis());
});

test.after(() => {
  sandbox.restore();
});

test('RedisCache should work', async (t) => {
  const cache = new RedisCache('test');

  t.is(cache.getCacheKey('test'), 'test:test');

  await cache.setCache('key', 'value');
  t.is(await cache.getCache('key'), 'value');
  t.is(await cache.hasCache('key'), true);

  await cache.deleteCache('key');
  t.is(await cache.hasCache('key'), false);
});
