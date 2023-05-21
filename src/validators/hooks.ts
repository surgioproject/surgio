import { Promisable } from 'type-fest'
import { z } from 'zod'

import { GetNodeListParams } from '../provider'
import { PossibleNodeConfigType } from '../types'

type AfterFetchNodeListHook = <T extends PossibleNodeConfigType>(
  nodeList: T[],
  customParams: GetNodeListParams,
) => Promisable<T[] | undefined | void>

export const AfterFetchNodeListHookValidator = z.custom<AfterFetchNodeListHook>(
  (val) => {
    return typeof val === 'function'
  },
)
