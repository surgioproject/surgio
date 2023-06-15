import { Promisable } from 'type-fest'
import { z } from 'zod'

import { GetNodeListParams } from '../provider'
import { PossibleNodeConfigType } from '../types'

type AfterNodeListResponse = <T extends PossibleNodeConfigType>(
  nodeList: T[],
  customParams: GetNodeListParams,
) => Promisable<T[] | undefined | void>

export const AfterNodeListResponseHookValidator =
  z.custom<AfterNodeListResponse>((val) => {
    return typeof val === 'function'
  })

type OnError = (error: Error) => Promisable<unknown>

export const OnErrorHookValidator = z.custom<OnError>((val) => {
  return typeof val === 'function'
})
