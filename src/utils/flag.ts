import EmojiRegex from 'emoji-regex'
import _ from 'lodash'

import { FLAGS } from '../misc/flag_cn'

const flagMap: Map<string | RegExp, string> = new Map()
const customFlagMap: Map<string | RegExp, string> = new Map()

for (const [key, value] of Object.entries(FLAGS)) {
  value.forEach((name: string) => {
    flagMap.set(name, key)
  })
}

export const addFlagMap = (name: string | RegExp, emoji: string): void => {
  if (flagMap.has(name)) {
    flagMap.delete(name)
  }
  customFlagMap.set(name, emoji)
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

  for (const [key, value] of customFlagMap.entries()) {
    if (_.isRegExp(key)) {
      if (key.test(str)) {
        return `${value} ${str}`
      }
    } else {
      const isKeyChineseCharacters = /[\u4E00-\u9FA5]/.test(key)
      const regex = new RegExp(`(^|\\b)${key}(\\b|$)`, 'i')

      if (isKeyChineseCharacters && str.toUpperCase().includes(key)) {
        return `${value} ${str}`
      } else if (!isKeyChineseCharacters && regex.test(str)) {
        return `${value} ${str}`
      }
    }
  }

  for (const [key, value] of flagMap.entries()) {
    if (_.isRegExp(key)) {
      if (key.test(str)) {
        return `${value} ${str}`
      }
    } else {
      const isKeyChineseCharacters = /[\u4E00-\u9FA5]/.test(key)
      const regex = new RegExp(`(^|\\b)${key}(\\b|$)`, 'i')

      if (isKeyChineseCharacters && str.toUpperCase().includes(key)) {
        return `${value} ${str}`
      } else if (!isKeyChineseCharacters && regex.test(str)) {
        return `${value} ${str}`
      }
    }
  }

  return str
}

export const removeFlag = (str: string): string => {
  const emojiRegex = EmojiRegex()
  return str.replace(emojiRegex, '').trim()
}
