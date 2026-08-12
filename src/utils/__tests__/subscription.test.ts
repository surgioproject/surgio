import { expect, test } from 'vitest'

import {
  formatSubscriptionUserInfo,
  parseSubscriptionNode,
  parseSubscriptionUserInfo,
} from '../subscription'

test('parseSubscriptionNode', () => {
  const result = parseSubscriptionNode(
    '剩余流量：57.37% 1.01TB',
    '过期时间：2020-04-21 22:27:38',
  )
  if (!result) throw new Error()
  const reformat = formatSubscriptionUserInfo(result)

  expect(result.upload).toBe(0)
  expect(result.download).toBe(825185680652)
  expect(result.total).toBe(1935692424705)
  expect(reformat.expire.includes('2020-04-21')).toBeTruthy()
})

test('formatSubscriptionUserInfo', () => {
  expect(
    parseSubscriptionUserInfo(
      'upload=0; download=42211676245; total=216256217222; expire=1584563470;',
    ),
  ).toEqual({
    upload: 0,
    download: 42211676245,
    total: 216256217222,
    expire: 1584563470,
  })

  expect(
    parseSubscriptionUserInfo(
      'upload=0; download=42211676245; total=216256217222; expire=1584563470',
    ),
  ).toEqual({
    upload: 0,
    download: 42211676245,
    total: 216256217222,
    expire: 1584563470,
  })
})
