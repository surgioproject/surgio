import test from 'ava';
import sinon from 'sinon';
import MockRedis from 'ioredis-mock';

import redis from '../../redis';
import { createTmpFactory } from '../tmp-helper';

const sandbox = sinon.createSandbox();

test.before(() => {
  redis.createRedis('', MockRedis);
});

test.after(async () => {
  sandbox.restore();
  await redis.destroyRedis();
});

test('should work', async (t) => {
  const factory = createTmpFactory('tmp-helper-test', 'redis');

  const tmp = factory('tmp1.txt');

  t.is(await tmp.getContent(), void 0);
  await tmp.setContent('123456abcdef');
  t.is(await tmp.getContent(), '123456abcdef');
  t.is(await tmp.getContent(), '123456abcdef');
});
