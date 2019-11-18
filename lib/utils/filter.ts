import _ from 'lodash';

import { NodeNameFilterType, SimpleNodeConfig, SortedNodeNameFilterType } from '../types';

// tslint:disable-next-line:max-classes-per-file
export class SortFilterWithSortedFilters implements SortedNodeNameFilterType {
  public supportSort = true;

  constructor(public _filters: ReadonlyArray<NodeNameFilterType>) {
    this.filter.bind(this);
  }

  public filter<T>(nodeList: ReadonlyArray<T & SimpleNodeConfig>): ReadonlyArray<T & SimpleNodeConfig> {
    const result = [];

    this._filters.forEach(filter => {
      result.push(...nodeList.filter(filter));
    });

    return _.uniqBy(result, node => node.nodeName);
  }
}

// tslint:disable-next-line:max-classes-per-file
export class SortFilterWithSortedKeywords implements SortedNodeNameFilterType {
  public supportSort = true;

  constructor(public _keywords: ReadonlyArray<string>) {
    this.filter.bind(this);
  }

  public filter<T>(nodeList: ReadonlyArray<T & SimpleNodeConfig>): ReadonlyArray<T & SimpleNodeConfig> {
    const result = [];

    this._keywords.forEach(keyword => {
      result.push(...nodeList.filter(node => node.nodeName.includes(keyword)));
    });

    return _.uniqBy(result, node => node.nodeName);
  }
}

export const validateFilter = (filter: any): boolean => {
  if (filter === null || filter === void 0) {
    return false;
  }
  if (typeof filter === 'function') {
    return true;
  }
  return typeof filter === 'object' && filter.supportSort && typeof filter.filter === 'function';
};

export const mergeFilters = (filters: ReadonlyArray<NodeNameFilterType>, isStrict?: boolean): NodeNameFilterType => {
  filters.forEach(filter => {
    if (filter.hasOwnProperty('supportSort') && (filter as any).supportSort) {
      throw new Error('mergeFilters 不支持包含排序功能的过滤器');
    }

    if (typeof filter !== 'function') {
      throw new Error('mergeFilters 传入了无效的过滤器');
    }
  });

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

export const useSortedKeywords = (keywords: ReadonlyArray<string>): SortedNodeNameFilterType => {
  // istanbul ignore next
  if (!Array.isArray(keywords)) {
    throw new Error('keywords 请使用数组');
  }

  return new SortFilterWithSortedKeywords(keywords);
};

export const mergeSortedFilters = (filters: ReadonlyArray<NodeNameFilterType>): SortedNodeNameFilterType => {
  filters.forEach(filter => {
    if (filter.hasOwnProperty('supportSort') && (filter as any).supportSort) {
      throw new Error('mergeSortedFilters 不支持包含排序功能的过滤器');
    }

    if (typeof filter !== 'function') {
      throw new Error('mergeSortedFilters 传入了无效的过滤器');
    }
  });

  return new SortFilterWithSortedFilters(filters);
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
