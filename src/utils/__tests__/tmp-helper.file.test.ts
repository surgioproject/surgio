import path from 'path'
import os from 'os'
import { afterEach, expect, test, vi } from 'vitest'
import fs from 'fs-extra'

import { TMP_FOLDER_NAME } from '../../constant'
import { createTmpFactory, TmpFile } from '../tmp-helper'

afterEach(async () => {
  vi.useRealTimers()

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
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))

  const factory = createTmpFactory(
    'tmp-helper-test-folder' + `_nodejs_${process.version}`,
  )
  const tmp = factory('tmp2.txt', 1000)

  expect(await tmp.getContent()).toBe(void 0)
  await tmp.setContent('123456abcdef')
  vi.advanceTimersByTime(100)
  expect(await tmp.getContent()).toBe('123456abcdef')
  vi.advanceTimersByTime(1000)
  expect(await tmp.getContent()).toBe(void 0)
  await tmp.setContent('123456abcdefg')
  vi.advanceTimersByTime(100)
  expect(await tmp.getContent()).toBe('123456abcdefg')
  expect(await tmp.getContent()).toBe('123456abcdefg')
})

test('should work with maxAge 2', async () => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))

  const factory = createTmpFactory(
    'tmp-helper-test-folder' + `_nodejs_${process.version}`,
  )
  const tmp = factory('tmp3.txt', 1000)

  expect(await tmp.getContent()).toBe(void 0)
  await tmp.setContent('123456abcdef')
  vi.advanceTimersByTime(100)
  expect(await tmp.getContent()).toBe('123456abcdef')
})
