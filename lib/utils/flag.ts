import EmojiRegex from 'emoji-regex';
import _ from 'lodash';

import flag from '../misc/flag_cn';

const flagMap: Map<string|RegExp, string> = new Map();
const customFlagMap: Map<string|RegExp, string> = new Map();

Object.keys(flag).forEach(emoji => {
  flag[emoji].forEach((name: string) => {
    flagMap.set(name, emoji);
  });
});

export const addFlagMap = (name: string|RegExp, emoji: string): void => {
  if (flagMap.has(name)) {
    flagMap.delete(name)
  }
  customFlagMap.set(name, emoji);
};

export const prependFlag = (str: string, removeExistingEmoji = false): string => {
  const emojiRegex = EmojiRegex();
  const existingEmoji = emojiRegex.exec(str);

  if (existingEmoji) {
    if (removeExistingEmoji) {
      // 去除已有的 emoji
      str = removeFlag(str);
    } else {
      // 不作处理
      return str;
    }
  }

  for (const [key, value] of customFlagMap.entries()) {
    if (_.isRegExp(key)) {
      if (key.test(str)) {
        return `${value} ${str}`;
      }
    } else {
      if (str.toUpperCase().includes(key)) {
        return `${value} ${str}`;
      }
    }
  }

  for (const [key, value] of flagMap.entries()) {
    if (_.isRegExp(key)) {
      if (key.test(str)) {
        return `${value} ${str}`;
      }
    } else {
      if (str.toUpperCase().includes(key)) {
        return `${value} ${str}`;
      }
    }
  }

  return str;
};

export const removeFlag = (str: string): string => {
  const emojiRegex = EmojiRegex();
  return str.replace(emojiRegex, '').trim();
};
