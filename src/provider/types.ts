import { IncomingHttpHeaders } from 'http'

import { PossibleNodeConfigType, SubscriptionUserinfo } from '../types'

import BlackSSLProvider from './BlackSSLProvider'
import ClashProvider from './ClashProvider'
import CustomProvider from './CustomProvider'
import ShadowsocksJsonSubscribeProvider from './ShadowsocksJsonSubscribeProvider'
import ShadowsocksrSubscribeProvider from './ShadowsocksrSubscribeProvider'
import ShadowsocksSubscribeProvider from './ShadowsocksSubscribeProvider'
import SsdProvider from './SsdProvider'
import TrojanProvider from './TrojanProvider'
import V2rayNSubscribeProvider from './V2rayNSubscribeProvider'

export type PossibleProviderType =
  | BlackSSLProvider
  | ShadowsocksJsonSubscribeProvider
  | ShadowsocksSubscribeProvider
  | CustomProvider
  | V2rayNSubscribeProvider
  | ShadowsocksrSubscribeProvider
  | ClashProvider
  | SsdProvider
  | TrojanProvider

export type DefaultProviderRequestHeaders = IncomingHttpHeaders

export type GetNodeListParams = Record<string, unknown> & {
  requestUserAgent?: string
  requestHeaders?: IncomingHttpHeaders
}

export type GetNodeListFunction = (
  params?: GetNodeListParams,
) => Promise<ReadonlyArray<PossibleNodeConfigType>>

export type GetSubscriptionUserInfoFunction = (
  params?: GetNodeListParams,
) => Promise<SubscriptionUserinfo | undefined>

export type GetNodeListV2Result = {
  readonly nodeList: ReadonlyArray<PossibleNodeConfigType>
  readonly subscriptionUserInfo?: SubscriptionUserinfo
}

export type GetNodeListV2Function = (
  params?: GetNodeListParams,
) => Promise<GetNodeListV2Result>
