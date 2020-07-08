import EmojiRegex from 'emoji-regex'
import flag from '../misc/flag_cn';

const flagMap: {
  [name: string]: string;
} = {};

Object.keys(flag).forEach(emoji => {
  flag[emoji].forEach((name: string) => {
    flagMap[name] = emoji;
  });
});

export const prependFlag = (str: string): string => {
  const emojiRegex = EmojiRegex();
  const existingEmoji = emojiRegex.exec(str);

  // 如果已经存在 emoji 则不作处理
  if (existingEmoji) {
    return str;
  }

  for (const key in flagMap) {
    if (flagMap.hasOwnProperty(key) && str.toUpperCase().includes(key)) {
      return `${flagMap[key]} ${str}`;
    }
  }
  return str;
};
