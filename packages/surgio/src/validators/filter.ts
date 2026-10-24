import { z } from 'zod/v3'

import type { PossibleNodeConfigType } from '../types.js'

type NodeFilterType = (nodeConfig: PossibleNodeConfigType) => boolean

export const NodeFilterTypeValidator = z.custom<NodeFilterType>((val) => {
  return typeof val === 'function'
})

type SortedNodeFilterType = {
  readonly filter: <T extends PossibleNodeConfigType>(
    nodeList: ReadonlyArray<T>,
  ) => ReadonlyArray<T>
  readonly supportSort: true
}

export const SortedNodeFilterTypeValidator = z.custom<SortedNodeFilterType>(
  (val) => {
    return (
      typeof val === 'object' &&
      val !== null &&
      'filter' in val &&
      typeof val.filter === 'function' &&
      ('supportSort' in val ? typeof val.supportSort === 'boolean' : true)
    )
  },
)
