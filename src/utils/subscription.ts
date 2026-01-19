import { filesize } from 'filesize'
import bytes from 'bytes'
import { format, formatDistanceToNow } from 'date-fns'

import { SubscriptionUserinfo } from '../types'

export const parseSubscriptionUserInfo = (
  str: string,
): SubscriptionUserinfo => {
  const res = {
    upload: 0,
    download: 0,
    total: 0,
    expire: 0,
  }

  str.split(';').forEach((item) => {
    if (!item) {
      return
    }
    const pair = item.split('=')
    const key = pair[0].trim()
    const value = Number(pair[1].trim())

    if (key in res && !Number.isNaN(value)) {
      res[key as keyof typeof res] = value
    }
  })

  return res
}

export const parseSubscriptionNode = (
  dataString: string,
  expireString: string,
): SubscriptionUserinfo | undefined => {
  // dataString => 剩余流量：57.37% 1.01TB
  // expireString => 过期时间：2020-04-21 22:27:38

  const dataMatch = dataString.match(/剩余流量：(\d{0,2}(\.\d{1,4})?)%\s(.*)$/)
  const expireMatch = expireString.match(/过期时间：(.*)$/)

  if (dataMatch && expireMatch) {
    const percent = Number(dataMatch[1]) / 100
    const leftData = bytes.parse(dataMatch[3]) ?? 0
    const total = Number((Number(leftData) / percent).toFixed(0))
    const expire = Math.floor(new Date(expireMatch[1]).getTime() / 1000)

    return {
      upload: 0,
      download: total - Number(leftData),
      total,
      expire,
    }
  } else {
    return undefined
  }
}

export const formatSubscriptionUserInfo = (
  userInfo: SubscriptionUserinfo,
): {
  readonly upload: string
  readonly download: string
  readonly used: string
  readonly left: string
  readonly total: string
  readonly expire: string
} => {
  return {
    upload: filesize(userInfo.upload, { base: 2 }) as string,
    download: filesize(userInfo.download, { base: 2 }) as string,
    used: filesize(userInfo.upload + userInfo.download, { base: 2 }) as string,
    left: filesize(userInfo.total - userInfo.upload - userInfo.download, {
      base: 2,
    }) as string,
    total: filesize(userInfo.total, { base: 2 }) as string,
    expire: userInfo.expire
      ? `${format(
          new Date(userInfo.expire * 1000),
          'yyyy-MM-dd',
        )} (${formatDistanceToNow(new Date(userInfo.expire * 1000))})`
      : '无数据',
  }
}
