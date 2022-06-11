import _ from 'lodash';
import micromatch from 'micromatch';

import flag, { TAIWAN } from '../misc/flag_cn';
import {
  NodeNameFilterType,
  NodeTypeEnum,
  SimpleNodeConfig,
  SortedNodeNameFilterType,
} from '../types';

// tslint:disable-next-line:max-classes-per-file
export class SortFilterWithSortedFilters implements SortedNodeNameFilterType {
  public supportSort = true;

  constructor(public _filters: ReadonlyArray<NodeNameFilterType>) {
    this.filter.bind(this);
  }

  public filter<T>(
    nodeList: ReadonlyArray<T & SimpleNodeConfig>,
  ): ReadonlyArray<T & SimpleNodeConfig> {
    const result: (T & SimpleNodeConfig)[] = [];

    this._filters.forEach((filter) => {
      result.push(...nodeList.filter(filter));
    });

    return _.uniqBy(result, (node) => node.nodeName);
  }
}

// tslint:disable-next-line:max-classes-per-file
export class SortFilterWithSortedKeywords implements SortedNodeNameFilterType {
  public supportSort = true;

  constructor(public _keywords: ReadonlyArray<string>) {
    this.filter.bind(this);
  }

  public filter<T>(
    nodeList: ReadonlyArray<T & SimpleNodeConfig>,
  ): ReadonlyArray<T & SimpleNodeConfig> {
    const result: (T & SimpleNodeConfig)[] = [];

    this._keywords.forEach((keyword) => {
      result.push(
        ...nodeList.filter((node) => node.nodeName.includes(keyword)),
      );
    });

    return _.uniqBy(result, (node) => node.nodeName);
  }
}

export const validateFilter = (filter: any): boolean => {
  if (filter === null || filter === void 0) {
    return false;
  }
  if (typeof filter === 'function') {
    return true;
  }
  return (
    typeof filter === 'object' &&
    filter.supportSort &&
    typeof filter.filter === 'function'
  );
};

export const applyFilter = <T extends SimpleNodeConfig>(
  nodeList: ReadonlyArray<T>,
  filter?: NodeNameFilterType | SortedNodeNameFilterType,
): ReadonlyArray<T> => {
  // istanbul ignore next
  if (filter && !validateFilter(filter)) {
    throw new Error(`使用了无效的过滤器 ${filter}`);
  }

  let nodes: ReadonlyArray<T> = nodeList.filter((item) => {
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
    nodes = filter.filter(nodes);
  }

  return nodes;
};

export const mergeFilters = (
  filters: ReadonlyArray<NodeNameFilterType>,
  isStrict?: boolean,
): NodeNameFilterType => {
  filters.forEach((filter) => {
    if (filter.hasOwnProperty('supportSort') && (filter as any).supportSort) {
      throw new Error('mergeFilters 不支持包含排序功能的过滤器');
    }

    // istanbul ignore next
    if (typeof filter !== 'function') {
      throw new Error('mergeFilters 传入了无效的过滤器');
    }
  });

  return (item: SimpleNodeConfig) => {
    return filters[isStrict ? 'every' : 'some']((filter) => filter(item));
  };
};

export const useKeywords = (
  keywords: ReadonlyArray<string>,
  isStrict?: boolean,
): NodeNameFilterType => {
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
  keywords: ReadonlyArray<string>,
  isStrict?: boolean,
): NodeNameFilterType => {
  // istanbul ignore next
  if (!Array.isArray(keywords)) {
    throw new Error('keywords 请使用数组');
  }

  return (item) =>
    !keywords[isStrict ? 'every' : 'some']((keyword) =>
      item.nodeName.includes(keyword),
    );
};

export const useRegexp = (regexp: RegExp): NodeNameFilterType => {
  // istanbul ignore next
  if (!_.isRegExp(regexp)) {
    throw new Error('入参不是一个合法的正则表达式');
  }

  return (item) => regexp.test(item.nodeName);
};

export const useGlob = (glob: string): NodeNameFilterType => {
  return (item) => matchGlob(item.nodeName, glob);
};

export const discardGlob = (glob: string): NodeNameFilterType => {
  return (item) => !matchGlob(item.nodeName, glob);
};

export const useProviders = (
  keywords: ReadonlyArray<string>,
  isStrict = true,
): NodeNameFilterType => {
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
  keywords: ReadonlyArray<string>,
  isStrict = true,
): NodeNameFilterType => {
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
  keywords: ReadonlyArray<string>,
): SortedNodeNameFilterType => {
  // istanbul ignore next
  if (!Array.isArray(keywords)) {
    throw new Error('keywords 请使用数组');
  }

  return new SortFilterWithSortedKeywords(keywords);
};

export const mergeSortedFilters = (
  filters: ReadonlyArray<NodeNameFilterType>,
): SortedNodeNameFilterType => {
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

export const netflixFilter: NodeNameFilterType = (item) => {
  return ['netflix', 'nf', 'hkbn', 'hkt', 'hgc', 'nbu'].some((key) =>
    item.nodeName.toLowerCase().includes(key),
  );
};

export const usFilter: NodeNameFilterType = (item) => {
  return ['🇺🇸', ...flag['🇺🇸']].some((key) =>
    item.nodeName.toUpperCase().includes(key),
  );
};

export const hkFilter: NodeNameFilterType = (item) => {
  return ['🇭🇰', ...flag['🇭🇰']].some((key) =>
    item.nodeName.toUpperCase().includes(key),
  );
};

export const japanFilter: NodeNameFilterType = (item) => {
  return ['🇯🇵', ...flag['🇯🇵']].some((key) =>
    item.nodeName.toUpperCase().includes(key),
  );
};

export const koreaFilter: NodeNameFilterType = (item) => {
  return ['🇰🇷', ...flag['🇰🇷']].some((key) =>
    item.nodeName.toUpperCase().includes(key),
  );
};

export const singaporeFilter: NodeNameFilterType = (item) => {
  return ['🇸🇬', ...flag['🇸🇬']].some((key) =>
    item.nodeName.toUpperCase().includes(key),
  );
};

export const taiwanFilter: NodeNameFilterType = (item) => {
  return ['🇹🇼', ...TAIWAN].some((key) =>
    item.nodeName.toUpperCase().includes(key),
  );
};

export const chinaBackFilter: NodeNameFilterType = (item) => {
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

export const chinaOutFilter: NodeNameFilterType = (item) => {
  return !chinaBackFilter(item);
};

export const youtubePremiumFilter: NodeNameFilterType = mergeFilters([
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
export const shadowsocksFilter: NodeNameFilterType = (item) =>
  item.type === NodeTypeEnum.Shadowsocks;
// istanbul ignore next
export const shadowsocksrFilter: NodeNameFilterType = (item) =>
  item.type === NodeTypeEnum.Shadowsocksr;
// istanbul ignore next
export const vmessFilter: NodeNameFilterType = (item) =>
  item.type === NodeTypeEnum.Vmess;
// istanbul ignore next
export const v2rayFilter: NodeNameFilterType = (item) =>
  item.type === NodeTypeEnum.Vmess;
// istanbul ignore next
export const snellFilter: NodeNameFilterType = (item) =>
  item.type === NodeTypeEnum.Snell;
// istanbul ignore next
export const httpFilter: NodeNameFilterType = (item) =>
  item.type === NodeTypeEnum.HTTP;
// istanbul ignore next
export const httpsFilter: NodeNameFilterType = (item) =>
  item.type === NodeTypeEnum.HTTPS;
// istanbul ignore next
export const trojanFilter: NodeNameFilterType = (item) =>
  item.type === NodeTypeEnum.Trojan;
// istanbul ignore next
export const socks5Filter: NodeNameFilterType = (item) =>
  item.type === NodeTypeEnum.Socks5;
