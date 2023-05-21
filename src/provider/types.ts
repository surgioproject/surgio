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

export type GetNodeListParams = Record<
  string,
  string | string[] | undefined
> & {
  requestUserAgent?: string
}

export type GetNodeListFunction = (
  params?: GetNodeListParams,
) => Promise<ReadonlyArray<PossibleNodeConfigType>>

export type GetSubscriptionUserInfoFunction = (params?: {
  requestUserAgent?: string
}) => Promise<SubscriptionUserinfo | undefined>
