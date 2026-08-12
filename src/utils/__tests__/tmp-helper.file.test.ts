import path from 'path'
import os from 'os'
import { afterEach, expect, test } from 'vitest'
import fs from 'fs-extra'
import Bluebird from 'bluebird'

import { TMP_FOLDER_NAME } from '../../constant'
import { createTmpFactory, TmpFile } from '../tmp-helper'

afterEach(async () => {
  const dir = path.join(
    os.tmpdir(),
    TMP_FOLDER_NAME,
    'tmp-helper-test-folder' + `_nodejs_${process.version}`,
  )
  if (fs.existsSync(dir)) {
    await fs.remove(dir)
  }
})

test('no permission', () => {
  expect(() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const file = new TmpFile('/System')
  }).toThrow()
})

test('should work', async () => {
  const factory = createTmpFactory(
    'tmp-helper-test-folder' + `_nodejs_${process.version}`,
  )
  const tmp = factory('tmp1.txt')

  expect(await tmp.getContent()).toBe(void 0)
  await tmp.setContent('123456abcdef')
  expect(await tmp.getContent()).toBe('123456abcdef')
  expect(await tmp.getContent()).toBe('123456abcdef')
})

test('should work with maxAge 1', async () => {
  const factory = createTmpFactory(
    'tmp-helper-test-folder' + `_nodejs_${process.version}`,
  )
  const tmp = factory('tmp2.txt', 1000)

  expect(await tmp.getContent()).toBe(void 0)
  await tmp.setContent('123456abcdef')
  await Bluebird.delay(100)
  expect(await tmp.getContent()).toBe('123456abcdef')
  await Bluebird.delay(1000)
  expect(await tmp.getContent()).toBe(void 0)
  await tmp.setContent('123456abcdefg')
  await Bluebird.delay(100)
  expect(await tmp.getContent()).toBe('123456abcdefg')
  expect(await tmp.getContent()).toBe('123456abcdefg')
})

test('should work with maxAge 2', async () => {
  const factory = createTmpFactory(
    'tmp-helper-test-folder' + `_nodejs_${process.version}`,
  )
  const tmp = factory('tmp3.txt', 1000)

  expect(await tmp.getContent()).toBe(void 0)
  await tmp.setContent('123456abcdef')
  await Bluebird.delay(100)
  expect(await tmp.getContent()).toBe('123456abcdef')
})
