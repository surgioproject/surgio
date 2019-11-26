import test from 'ava';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import Bluebird from 'bluebird';
import { createTmpFactory, TmpFile } from '../../lib/utils/tmp-helper';

test.after.always(async () => {
  const dir = path.join(os.tmpdir(), 'surgio-config', 'tmp-helper-test-folder');
  if (fs.existsSync(dir)) {
    await fs.remove(dir);
  }
});

test.serial('no permission', t => {
  t.throws(() => {
    const file = new TmpFile('/System');
  });
});

test.serial('should work', async t => {
  const factory = createTmpFactory('tmp-helper-test-folder');
  const tmp = factory('tmp1.txt');

  t.is(await tmp.getContent(), void 0);
  await tmp.setContent('123456abcdef');
  t.is(await tmp.getContent(), '123456abcdef');
  t.is(await tmp.getContent(), '123456abcdef');
});

test.serial('should work with maxAge 1', async t => {
  const factory = createTmpFactory('tmp-helper-test-folder');
  const tmp = factory('tmp2.txt', 50);

  t.is(await tmp.getContent(), void 0);
  await tmp.setContent('123456abcdef');
  t.is(await tmp.getContent(), '123456abcdef');
  await Bluebird.delay(1000);
  t.is(await tmp.getContent(), void 0);
  await tmp.setContent('123456abcdefg');
  t.is(await tmp.getContent(), '123456abcdefg');
  t.is(await tmp.getContent(), '123456abcdefg');
});

test.serial('should work with maxAge 2', async t => {
  const factory = createTmpFactory('tmp-helper-test-folder');
  const tmp = factory('tmp3.txt', 1000);

  t.is(await tmp.getContent(), void 0);
  await tmp.setContent('123456abcdef');
  await Bluebird.delay(100);
  t.is(await tmp.getContent(), '123456abcdef');
});
