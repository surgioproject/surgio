import json5 from 'json5';
import fs from 'fs-extra';
import path from 'path';
import EmojiRegex from 'emoji-regex'

const emojiRegex = EmojiRegex();
const flag: any = json5.parse(fs.readFileSync(path.join(__dirname, '../../static/flag_cn.json5'), {
  encoding: 'utf8',
}));
const flagMap: {
  [name: string]: string; // tslint:disable-line
} = {};

Object.keys(flag).forEach(emoji => {
  flag[emoji].forEach((name: string) => {
    flagMap[name] = emoji;
  });
});

export const prependFlag = (str: string): string => {
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
