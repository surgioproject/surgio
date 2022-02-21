import _ from 'lodash';

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

export const regexFilter = (regex: string): NodeNameFilterType => {
  const regexpGroup = {
    /************************ Network filters ************************/
    Private: RegExp(/IPLC|IEPL|AIA|专线/i), // 专线
    Relay: RegExp(/中继|中转|转发|CN2|BGP/i), // 中转
    Direct: RegExp(/直连|DIRECT/i), //直连
    Streaming: RegExp(/流媒|解锁|Netflix|NF|原生/i), // 流媒体
    Game: RegExp(/游戏|Game|UDP/i), // 游戏
    SOS: RegExp(/应急|公益|失联/i), // 应急
    /*********************** Continent filters ***********************/
    AF: RegExp(/(埃及|EG|南非|ZA)/i),
    AS: RegExp(
      /(中国|CN|香港(?!转|中)|HK|澳门|MO|台湾|TW|新加坡|SG|马来|MY|泰国|TH|菲律宾|PH|日本|JP|韩国|KR|印度|IN|巴基|PK)/i,
    ),
    OA: RegExp(/(澳大利亚|澳洲|AU|新西兰|NZ)/i),
    NA: RegExp(/(美国|US(?!SIA)|UNITED STATES|加拿大|CA|CANADA)/i),
    SA: RegExp(/(墨西哥|MX|巴西|BR|智利|CL)/i),
    EU: RegExp(
      /(英国|UK|法国|FR|德国|DE|意大利|IT|俄罗斯|RU|荷兰|NL|波兰|PL|葡萄牙|PT|土耳其|TR)/i,
    ),
    /************************ Country filters ************************/
    Greater_China: RegExp(
      /(中国|CN|香港(?!转|中)|HK|澳门|MO|台湾|TW|新加坡|SG|马来|MY|泰国|TH|菲律宾|PH)/i,
    ),
    HK: RegExp(/(香港(?!转|中)|HK)/i),
    MO: RegExp(/(澳门|MO|MACAU)/i),
    TW: RegExp(/(台湾|TW|TAIWAN|台北|新北|彰化)/i),
    SG: RegExp(/(新加坡|SG|SINGAPORE|SIN|狮城)/i),
    JP: RegExp(/(日本|JP|东京|大阪|埼玉)/i),
    US: RegExp(
      /(美国|US(?!SIA)|UNITED STATES|洛杉矶|LAX|硅谷|达拉斯|费利蒙|凤凰城|芝加哥|圣何塞|西雅图|旧金山|SFO)/i,
    ),
  };
  const regexp = regexpGroup?.[regex] ?? undefined;
  // istanbul ignore next
  if (!_.isRegExp(regexp)) {
    throw new Error('入参不是一个合法的正则表达式');
  }

  return (item) => regexp.test(item.nodeName);
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
