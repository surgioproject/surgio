import EmojiRegex from 'emoji-regex'
import _ from 'lodash'

import { FLAGS } from '../misc/flag_cn.js'

interface FlagMatcher {
  emoji: string
  matches: (str: string, uppercase: string) => boolean
}

const createFlagMatcher = (
  name: string | RegExp,
  emoji: string,
): FlagMatcher => {
  if (!_.isRegExp(name) && /[\u4E00-\u9FA5]/.test(name)) {
    return { emoji, matches: (_str, uppercase) => uppercase.includes(name) }
  }

  const regex = _.isRegExp(name)
    ? name
    : new RegExp(`(^|\\b)${name}(\\b|$)`, 'i')
  return {
    emoji,
    matches: (str) => {
      regex.lastIndex = 0
      return regex.test(str)
    },
  }
}

const flagMap = new Map<string | RegExp, FlagMatcher>()
const customFlagMap = new Map<string | RegExp, FlagMatcher>()

for (const [key, value] of Object.entries(FLAGS)) {
  value.forEach((name: string) => {
    flagMap.set(name, createFlagMatcher(name, key))
  })
}

export const addFlagMap = (name: string | RegExp, emoji: string): void => {
  const matcher = createFlagMatcher(name, emoji)
  flagMap.delete(name)
  customFlagMap.set(name, matcher)
}

export const prependFlag = (
  str: string,
  removeExistingEmoji = false,
): string => {
  const emojiRegex = EmojiRegex()
  const existingEmoji = emojiRegex.exec(str)

  if (existingEmoji) {
    if (removeExistingEmoji) {
      // 去除已有的 emoji
      str = removeFlag(str)
    } else {
      // 不作处理
      return str
    }
  }

  const uppercase = str.toUpperCase()
  for (const { matches, emoji } of customFlagMap.values()) {
    if (matches(str, uppercase)) {
      return `${emoji} ${str}`
    }
  }

  for (const { matches, emoji } of flagMap.values()) {
    if (matches(str, uppercase)) {
      return `${emoji} ${str}`
    }
  }

  return str
}

export const removeFlag = (str: string): string => {
  const emojiRegex = EmojiRegex()
  return str.replace(emojiRegex, '').trim()
}
