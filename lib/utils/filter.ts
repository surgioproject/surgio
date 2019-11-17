import _ from 'lodash';

import { NodeNameFilterType, SimpleNodeConfig } from '../types';

export const mergeFilters = (filters: ReadonlyArray<NodeNameFilterType>, isStrict?: boolean): NodeNameFilterType => {
  return (item: SimpleNodeConfig) => {
    return filters[isStrict ? 'every' : 'some'](filter => filter(item));
  };
};

export const useKeywords = (keywords: ReadonlyArray<string>, isStrict?: boolean): NodeNameFilterType => {
  // istanbul ignore next
  if (!Array.isArray(keywords)) {
    throw new Error('keywords 请使用数组');
  }

  return item => keywords[isStrict ? 'every' : 'some'](keyword => item.nodeName.includes(keyword));
};

// export const useSortedKeywords = ()

export const discardKeywords = (keywords: ReadonlyArray<string>, isStrict?: boolean): NodeNameFilterType => {
  // istanbul ignore next
  if (!Array.isArray(keywords)) {
    throw new Error('keywords 请使用数组');
  }

  return item => !keywords[isStrict ? 'every' : 'some'](keyword => item.nodeName.includes(keyword));
};

export const useRegexp = (regexp: RegExp): NodeNameFilterType => {
  // istanbul ignore next
  if (!_.isRegExp(regexp)) {
    throw new Error('入参不是一个合法的正则表达式');
  }

  return item => regexp.test(item.nodeName);
};

export const netflixFilter: NodeNameFilterType = item => {
  return [
    'netflix',
    'nf',
    'hkbn',
    'hkt',
    'hgc',
  ].some(key => item.nodeName.toLowerCase().includes(key));
};

export const usFilter: NodeNameFilterType = item => {
  return [
    '🇺🇸', '美', 'us', '波特兰', '达拉斯', '俄勒冈',
    '凤凰城', '费利蒙', '硅谷', '拉斯维加斯', '洛杉矶',
    '圣何塞', '圣克拉拉', '西雅图', '芝加哥',
  ].some(key => item.nodeName.toLowerCase().includes(key));
};

export const hkFilter: NodeNameFilterType = item => {
  return ['🇭🇰', '港', 'hk'].some(key => item.nodeName.toLowerCase().includes(key));
};

export const japanFilter: NodeNameFilterType = item => {
  return [
    '🇯🇵', '日', 'jp', 'japan', '东京', '大阪', '埼玉',
  ].some(key => item.nodeName.toLowerCase().includes(key));
};

export const koreaFilter: NodeNameFilterType = item => {
  return ['🇰🇷', '韩', 'korea', '首尔'].some(key => item.nodeName.toLowerCase().includes(key));
};

export const singaporeFilter: NodeNameFilterType = item => {
  return ['🇸🇬', '新加坡', 'sin', 'singapore'].some(key => item.nodeName.toLowerCase().includes(key));
};

export const taiwanFilter: NodeNameFilterType = item => {
  return [
    '🇹🇼', '台湾', '台灣', '臺灣', 'tw', 'taiwan',
    '台北', '台中', '新北', '彰化',
  ].some(key => item.nodeName.toLowerCase().includes(key));
};

export const youtubePremiumFilter: NodeNameFilterType = mergeFilters([usFilter, japanFilter, koreaFilter, hkFilter, singaporeFilter]);
