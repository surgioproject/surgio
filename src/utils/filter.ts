import _ from 'lodash';
import micromatch from 'micromatch';

import flag, { TAIWAN } from '../misc/flag_cn';
import {
  NodeFilterType,
  NodeTypeEnum,
  SortedNodeFilterType,
  PossibleNodeConfigType,
} from '../types';

// tslint:disable-next-line:max-classes-per-file
export class SortFilterWithSortedFilters implements SortedNodeFilterType {
  public supportSort = true;

  constructor(public _filters: Array<NodeFilterType>) {
    this.filter.bind(this);
  }

  public filter<T extends PossibleNodeConfigType>(
    nodeList: ReadonlyArray<T>,
  ): ReadonlyArray<T> {
    const result: T[] = [];

    this._filters.forEach((filter) => {
      result.push(...nodeList.filter(filter));
    });

    return _.uniqBy(result, (node) => node.nodeName);
  }
}

// tslint:disable-next-line:max-classes-per-file
export class SortFilterWithSortedKeywords implements SortedNodeFilterType {
  public supportSort = true;

  constructor(public _keywords: Array<string>) {
    this.filter.bind(this);
  }

  public filter<T extends PossibleNodeConfigType>(
    nodeList: ReadonlyArray<T>,
  ): ReadonlyArray<T> {
    const result: T[] = [];

    this._keywords.forEach((keyword) => {
      result.push(
        ...nodeList.filter((node) => node.nodeName.includes(keyword)),
      );
    });

    return _.uniqBy(result, (node) => node.nodeName);
  }
}

export const validateFilter = (filter: unknown): boolean => {
  if (filter === null || filter === undefined) {
    return false;
  }
  if (typeof filter === 'function') {
    return true;
  }
  return (
    typeof filter === 'object' &&
    'supportSort' in filter &&
    'filter' in filter &&
    typeof filter.supportSort === 'boolean' &&
    typeof filter.filter === 'function'
  );
};

export const applyFilter = <T extends PossibleNodeConfigType>(
  nodeList: ReadonlyArray<T>,
  filter?: NodeFilterType | SortedNodeFilterType,
): ReadonlyArray<T> => {
  // istanbul ignore next
  if (filter && !validateFilter(filter)) {
    throw new Error(`使用了无效的过滤器 ${filter}`);
  }

  let newNodeList: ReadonlyArray<T> = nodeList.filter((item) => {
    const result = item.enable !== false;

    if (filter && typeof filter === 'function') {
      return filter(item) && result;
    }

    return result;
  });

  if (
    filter &&
    typeof filter === 'object' &&
    typeof filter.filter === 'function'
  ) {
    newNodeList = filter.filter(newNodeList);
  }

  return newNodeList;
};

export const mergeFilters = (
  filters: Array<NodeFilterType>,
  isStrict?: boolean,
): NodeFilterType => {
  filters.forEach((filter) => {
    if (filter.hasOwnProperty('supportSort') && (filter as any).supportSort) {
      throw new Error('mergeFilters 不支持包含排序功能的过滤器');
    }

    // istanbul ignore next
    if (typeof filter !== 'function') {
      throw new Error('mergeFilters 传入了无效的过滤器');
    }
  });

  return (item) => {
    return filters[isStrict ? 'every' : 'some']((filter) => filter(item));
  };
};

export const useKeywords = (
  keywords: Array<string>,
  isStrict?: boolean,
): NodeFilterType => {
  // istanbul ignore next
  if (!Array.isArray(keywords)) {
    throw new Error('keywords 请使用数组');
  }

  return (item) =>
    keywords[isStrict ? 'every' : 'some']((keyword) =>
      item.nodeName.includes(keyword),
    );
};

export const discardKeywords = (
  keywords: Array<string>,
  isStrict?: boolean,
): NodeFilterType => {
  // istanbul ignore next
  if (!Array.isArray(keywords)) {
    throw new Error('keywords 请使用数组');
  }

  return (item) =>
    !keywords[isStrict ? 'every' : 'some']((keyword) =>
      item.nodeName.includes(keyword),
    );
};

export const useRegexp = (regexp: RegExp): NodeFilterType => {
  // istanbul ignore next
  if (!_.isRegExp(regexp)) {
    throw new Error('入参不是一个合法的正则表达式');
  }

  return (item) => regexp.test(item.nodeName);
};

export const useGlob = (glob: string): NodeFilterType => {
  return (item) => matchGlob(item.nodeName, glob);
};

export const discardGlob = (glob: string): NodeFilterType => {
  return (item) => !matchGlob(item.nodeName, glob);
};

export const useProviders = (
  keywords: Array<string>,
  isStrict = true,
): NodeFilterType => {
  // istanbul ignore next
  if (!Array.isArray(keywords)) {
    throw new Error('keywords 请使用数组');
  }

  return (item) =>
    keywords.some((keyword) =>
      isStrict
        ? item?.provider?.name === keyword
        : item?.provider?.name.includes(keyword),
    );
};

export const discardProviders = (
  keywords: Array<string>,
  isStrict = true,
): NodeFilterType => {
  // istanbul ignore next
  if (!Array.isArray(keywords)) {
    throw new Error('keywords 请使用数组');
  }

  return (item) =>
    !keywords.some((keyword) =>
      isStrict
        ? item?.provider?.name === keyword
        : item?.provider?.name.includes(keyword),
    );
};

export const useSortedKeywords = (
  keywords: Array<string>,
): SortedNodeFilterType => {
  // istanbul ignore next
  if (!Array.isArray(keywords)) {
    throw new Error('keywords 请使用数组');
  }

  return new SortFilterWithSortedKeywords(keywords);
};

export const mergeSortedFilters = (
  filters: Array<NodeFilterType>,
): SortedNodeFilterType => {
  filters.forEach((filter) => {
    if (filter.hasOwnProperty('supportSort') && (filter as any).supportSort) {
      throw new Error('mergeSortedFilters 不支持包含排序功能的过滤器');
    }

    // istanbul ignore next
    if (typeof filter !== 'function') {
      throw new Error('mergeSortedFilters 传入了无效的过滤器');
    }
  });

  return new SortFilterWithSortedFilters(filters);
};

export const netflixFilter: NodeFilterType = (item) => {
  return ['netflix', 'nf', 'hkbn', 'hkt', 'hgc', 'nbu'].some((key) =>
    item.nodeName.toLowerCase().includes(key),
  );
};

export const usFilter: NodeFilterType = (item) => {
  return ['🇺🇸', ...flag['🇺🇸']].some((key) =>
    item.nodeName.toUpperCase().includes(key),
  );
};

export const hkFilter: NodeFilterType = (item) => {
  return ['🇭🇰', ...flag['🇭🇰']].some((key) =>
    item.nodeName.toUpperCase().includes(key),
  );
};

export const japanFilter: NodeFilterType = (item) => {
  return ['🇯🇵', ...flag['🇯🇵']].some((key) =>
    item.nodeName.toUpperCase().includes(key),
  );
};

export const koreaFilter: NodeFilterType = (item) => {
  return ['🇰🇷', ...flag['🇰🇷']].some((key) =>
    item.nodeName.toUpperCase().includes(key),
  );
};

export const singaporeFilter: NodeFilterType = (item) => {
  return ['🇸🇬', ...flag['🇸🇬']].some((key) =>
    item.nodeName.toUpperCase().includes(key),
  );
};

export const taiwanFilter: NodeFilterType = (item) => {
  return ['🇹🇼', ...TAIWAN].some((key) =>
    item.nodeName.toUpperCase().includes(key),
  );
};

export const chinaBackFilter: NodeFilterType = (item) => {
  return [
    '回国',
    'Back',
    '中国上海',
    '中国北京',
    '中国徐州',
    '中国深圳',
    '中国枣庄',
    '中国郑州',
    '硅谷上海',
    '东京上海',
    'GCX',
  ].some((key) => item.nodeName.includes(key));
};

export const chinaOutFilter: NodeFilterType = (item) => {
  return !chinaBackFilter(item);
};

export const youtubePremiumFilter: NodeFilterType = mergeFilters([
  usFilter,
  japanFilter,
  koreaFilter,
  hkFilter,
  singaporeFilter,
  taiwanFilter,
]);

export const matchGlob = (str: string, glob: string): boolean => {
  return micromatch.contains(str, glob);
};

// istanbul ignore next
export const shadowsocksFilter: NodeFilterType = (item) =>
  item.type === NodeTypeEnum.Shadowsocks;
// istanbul ignore next
export const shadowsocksrFilter: NodeFilterType = (item) =>
  item.type === NodeTypeEnum.Shadowsocksr;
// istanbul ignore next
export const vmessFilter: NodeFilterType = (item) =>
  item.type === NodeTypeEnum.Vmess;
// istanbul ignore next
export const v2rayFilter: NodeFilterType = (item) =>
  item.type === NodeTypeEnum.Vmess;
// istanbul ignore next
export const snellFilter: NodeFilterType = (item) =>
  item.type === NodeTypeEnum.Snell;
// istanbul ignore next
export const tuicFilter: NodeFilterType = (item) =>
  item.type === NodeTypeEnum.Tuic;
// istanbul ignore next
export const httpFilter: NodeFilterType = (item) =>
  item.type === NodeTypeEnum.HTTP;
// istanbul ignore next
export const httpsFilter: NodeFilterType = (item) =>
  item.type === NodeTypeEnum.HTTPS;
// istanbul ignore next
export const trojanFilter: NodeFilterType = (item) =>
  item.type === NodeTypeEnum.Trojan;
// istanbul ignore next
export const socks5Filter: NodeFilterType = (item) =>
  item.type === NodeTypeEnum.Socks5;
// istanbul ignore next
export const wireguardFilter: NodeFilterType = (item) =>
  item.type === NodeTypeEnum.Wireguard;
