import type { SubscriptionUserinfo } from '../types.js'

export const parseSubscriptionUserInfoHeader = (
  value: string,
): SubscriptionUserinfo => {
  const result: Record<keyof SubscriptionUserinfo, number> = {
    upload: 0,
    download: 0,
    total: 0,
    expire: 0,
  }
  for (const item of value.split(';')) {
    const [rawKey, rawValue] = item.split('=', 2)
    const key = rawKey?.trim()
    const number = Number(rawValue?.trim())
    if (key && key in result && !Number.isNaN(number)) {
      result[key as keyof SubscriptionUserinfo] = number
    }
  }
  return result
}
