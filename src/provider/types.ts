import { IncomingHttpHeaders } from 'http'

import { PossibleNodeConfigType, SubscriptionUserinfo } from '../types.js'

import BlackSSLProvider from './BlackSSLProvider.js'
import ClashProvider from './ClashProvider.js'
import CustomProvider from './CustomProvider.js'
import ShadowsocksJsonSubscribeProvider from './ShadowsocksJsonSubscribeProvider.js'
import ShadowsocksrSubscribeProvider from './ShadowsocksrSubscribeProvider.js'
import ShadowsocksSubscribeProvider from './ShadowsocksSubscribeProvider.js'
import SsdProvider from './SsdProvider.js'
import TrojanProvider from './TrojanProvider.js'
import V2rayNSubscribeProvider from './V2rayNSubscribeProvider.js'

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
