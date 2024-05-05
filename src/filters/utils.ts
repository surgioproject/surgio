import _ from 'lodash'
import micromatch from 'micromatch'

import {
  NodeFilterType,
  PossibleNodeConfigType,
  SortedNodeFilterType,
} from '../types'

import {
  SortFilterWithSortedFilters,
  SortFilterWithSortedKeywords,
} from './classes'

export const validateFilter = (filter: unknown): boolean => {
  if (filter === null || filter === undefined) {
    return false
  }
  if (typeof filter === 'function') {
    return true
  }
  return (
    typeof filter === 'object' &&
    'supportSort' in filter &&
    'filter' in filter &&
    typeof filter.supportSort === 'boolean' &&
    typeof filter.filter === 'function'
  )
}

export const applyFilter = <T extends PossibleNodeConfigType>(
  nodeList: ReadonlyArray<T>,
  filter?: NodeFilterType | SortedNodeFilterType,
): ReadonlyArray<T> => {
  // istanbul ignore next
  if (filter && !validateFilter(filter)) {
    throw new Error(`使用了无效的过滤器 ${filter}`)
  }

  let newNodeList: ReadonlyArray<T> = nodeList.filter((item) => {
    // Only checks the enable property when it's present, default to true
    const isEnabled = item.enable !== false

    if (filter && typeof filter === 'function') {
      return filter(item) && isEnabled
    }

    return isEnabled
  })

  if (
    filter &&
    typeof filter === 'object' &&
    typeof filter.filter === 'function'
  ) {
    newNodeList = filter.filter(newNodeList)
  }

  return newNodeList
}

export const mergeFilters = (
  filters: Array<NodeFilterType>,
  isStrict?: boolean,
): NodeFilterType => {
  filters.forEach((filter) => {
    if ('supportSort' in filter && filter.supportSort) {
      throw new Error('mergeFilters 不支持包含排序功能的过滤器')
    }

    // istanbul ignore next
    if (typeof filter !== 'function') {
      throw new Error('mergeFilters 传入了无效的过滤器')
    }
  })

  return (item) => {
    return filters[isStrict ? 'every' : 'some']((filter) => filter(item))
  }
}

export const useKeywords = (
  keywords: Array<string>,
  isStrict?: boolean,
): NodeFilterType => {
  // istanbul ignore next
  if (!Array.isArray(keywords)) {
    throw new Error('keywords 请使用数组')
  }

  return (item) =>
    keywords[isStrict ? 'every' : 'some']((keyword) =>
      item.nodeName.includes(keyword),
    )
}

export const discardKeywords = (
  keywords: Array<string>,
  isStrict?: boolean,
): NodeFilterType => {
  // istanbul ignore next
  if (!Array.isArray(keywords)) {
    throw new Error('keywords 请使用数组')
  }

  return (item) =>
    !keywords[isStrict ? 'every' : 'some']((keyword) =>
      item.nodeName.includes(keyword),
    )
}

export const useRegexp = (regexp: RegExp): NodeFilterType => {
  // istanbul ignore next
  if (!_.isRegExp(regexp)) {
    throw new Error('入参不是一个合法的正则表达式')
  }

  return (item) => regexp.test(item.nodeName)
}

export const matchGlob = (str: string, glob: string): boolean => {
  return micromatch.contains(str, glob)
}

export const useGlob = (glob: string): NodeFilterType => {
  return (item) => matchGlob(item.nodeName, glob)
}

export const discardGlob = (glob: string): NodeFilterType => {
  return (item) => !matchGlob(item.nodeName, glob)
}

export const useProviders = (
  keywords: Array<string>,
  isStrict = true,
): NodeFilterType => {
  // istanbul ignore next
  if (!Array.isArray(keywords)) {
    throw new Error('keywords 请使用数组')
  }

  return (item) =>
    keywords.some((keyword) =>
      isStrict
        ? item?.provider?.name === keyword
        : item?.provider?.name.includes(keyword),
    )
}

export const discardProviders = (
  keywords: Array<string>,
  isStrict = true,
): NodeFilterType => {
  // istanbul ignore next
  if (!Array.isArray(keywords)) {
    throw new Error('keywords 请使用数组')
  }

  return (item) =>
    !keywords.some((keyword) =>
      isStrict
        ? item?.provider?.name === keyword
        : item?.provider?.name.includes(keyword),
    )
}

export const useSortedKeywords = (
  keywords: Array<string>,
): SortedNodeFilterType => {
  // istanbul ignore next
  if (!Array.isArray(keywords)) {
    throw new Error('keywords 请使用数组')
  }

  return new SortFilterWithSortedKeywords(keywords)
}

export const mergeSortedFilters = (
  filters: Array<NodeFilterType>,
): SortedNodeFilterType => {
  filters.forEach((filter) => {
    if ('supportSort' in filter && filter.supportSort) {
      throw new Error('mergeSortedFilters 不支持包含排序功能的过滤器')
    }

    // istanbul ignore next
    if (typeof filter !== 'function') {
      throw new Error('mergeSortedFilters 传入了无效的过滤器')
    }
  })

  return new SortFilterWithSortedFilters(filters)
}

export const reverseFilter = (filter: NodeFilterType): NodeFilterType => {
  if ('supportSort' in filter && filter.supportSort) {
    throw new Error('reverseFilter 不支持包含排序功能的过滤器')
  }
  return (item) => !filter(item)
}

export const mergeReversedFilters = (
  filters: Array<NodeFilterType>,
  isStrict?: boolean,
): NodeFilterType => {
  filters.forEach((filter) => {
    if ('supportSort' in filter && filter.supportSort) {
      throw new Error('mergeReversedFilters 不支持包含排序功能的过滤器')
    }

    // istanbul ignore next
    if (typeof filter !== 'function') {
      throw new Error('mergeReversedFilters 传入了无效的过滤器')
    }
  })

  return (item) => {
    return filters[isStrict ? 'some' : 'every']((filter) => filter(item))
  }
}
