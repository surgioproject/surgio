import { format } from 'date-fns/format'
import { formatDistanceToNow } from 'date-fns/formatDistanceToNow'
import { filesize } from 'filesize'

import type { GatewaySubscriptionUserInfo } from './types.js'

export const formatSubscriptionUserInfo = (
  info: GatewaySubscriptionUserInfo
) => ({
  upload: filesize(info.upload, { base: 2 }),
  download: filesize(info.download, { base: 2 }),
  used: filesize(info.upload + info.download, { base: 2 }),
  left: filesize(info.total - info.upload - info.download, { base: 2 }),
  total: filesize(info.total, { base: 2 }),
  expire: info.expire
    ? `${format(new Date(info.expire * 1000), 'yyyy-MM-dd')} (${formatDistanceToNow(new Date(info.expire * 1000))})`
    : '无数据',
})
