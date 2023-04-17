import test from 'ava';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import Bluebird from 'bluebird';

import { TMP_FOLDER_NAME } from '../../constant';
import { createTmpFactory, TmpFile } from '../tmp-helper';

test.afterEach.always(async () => {
  const dir = path.join(
    os.tmpdir(),
    TMP_FOLDER_NAME,
    'tmp-helper-test-folder' + `_nodejs_${process.version}`,
  );
  if (fs.existsSync(dir)) {
    await fs.remove(dir);
  }
});

test.serial('no permission', (t) => {
  t.throws(() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const file = new TmpFile('/System');
  });
});

test.serial('should work', async (t) => {
  const factory = createTmpFactory(
    'tmp-helper-test-folder' + `_nodejs_${process.version}`,
  );
  const tmp = factory('tmp1.txt');

  t.is(await tmp.getContent(), void 0);
  await tmp.setContent('123456abcdef');
  t.is(await tmp.getContent(), '123456abcdef');
  t.is(await tmp.getContent(), '123456abcdef');
});

test.serial('should work with maxAge 1', async (t) => {
  const factory = createTmpFactory(
    'tmp-helper-test-folder' + `_nodejs_${process.version}`,
  );
  const tmp = factory('tmp2.txt', 1000);

  t.is(await tmp.getContent(), void 0);
  await tmp.setContent('123456abcdef');
  await Bluebird.delay(100);
  t.is(await tmp.getContent(), '123456abcdef');
  await Bluebird.delay(1000);
  t.is(await tmp.getContent(), void 0);
  await tmp.setContent('123456abcdefg');
  await Bluebird.delay(100);
  t.is(await tmp.getContent(), '123456abcdefg');
  t.is(await tmp.getContent(), '123456abcdefg');
});

test.serial('should work with maxAge 2', async (t) => {
  const factory = createTmpFactory(
    'tmp-helper-test-folder' + `_nodejs_${process.version}`,
  );
  const tmp = factory('tmp3.txt', 1000);

  t.is(await tmp.getContent(), void 0);
  await tmp.setContent('123456abcdef');
  await Bluebird.delay(100);
  t.is(await tmp.getContent(), '123456abcdef');
});
