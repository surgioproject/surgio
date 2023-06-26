import _ from 'lodash'

import {
  NodeFilterType,
  SortedNodeFilterType,
  PossibleNodeConfigType,
} from '../types'

// tslint:disable-next-line:max-classes-per-file
export class SortFilterWithSortedFilters implements SortedNodeFilterType {
  public readonly supportSort = true

  constructor(public _filters: Array<NodeFilterType>) {
    this.filter.bind(this)
  }

  public filter<T extends PossibleNodeConfigType>(
    nodeList: ReadonlyArray<T>,
  ): ReadonlyArray<T> {
    const result: T[] = []

    this._filters.forEach((filter) => {
      result.push(...nodeList.filter(filter))
    })

    return _.uniqBy(result, (node) => node.nodeName)
  }
}

// tslint:disable-next-line:max-classes-per-file
export class SortFilterWithSortedKeywords implements SortedNodeFilterType {
  public readonly supportSort = true

  constructor(public _keywords: Array<string>) {
    this.filter.bind(this)
  }

  public filter<T extends PossibleNodeConfigType>(
    nodeList: ReadonlyArray<T>,
  ): ReadonlyArray<T> {
    const result: T[] = []

    this._keywords.forEach((keyword) => {
      result.push(...nodeList.filter((node) => node.nodeName.includes(keyword)))
    })

    return _.uniqBy(result, (node) => node.nodeName)
  }
}
