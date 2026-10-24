import assert from 'assert'
import { logger } from '@surgio/logger'
import { z } from 'zod/v3'

import {
  type PossibleNodeConfigType,
  type SubscriptionUserinfo,
  type V2rayNSubscribeProviderConfig,
} from '../types.js'
import { SurgioError } from '../utils/errors.js'
import relayableUrl from '../utils/relayable-url.js'

import Provider from './Provider.js'
import {
  parseJSONConfig,
  parseV2rayNSubscription,
  type ParseV2rayNSubscriptionOptions,
} from './v2rayn-subscription.js'
import {
  type DefaultProviderRequestHeaders,
  type GetNodeListFunction,
  type GetNodeListParams,
  type GetNodeListV2Function,
  type GetNodeListV2Result,
} from './types.js'

import type { ProviderRuntimeContext } from '../runtime/types.js'

export { parseJSONConfig, parseV2rayNSubscription }

export default class V2rayNSubscribeProvider extends Provider {
  public readonly compatibleMode?: boolean
  public readonly skipCertVerify?: boolean
  public readonly udpRelay?: boolean
  public readonly tls13?: boolean

  readonly #originalUrl: string

  constructor(name: string, config: V2rayNSubscribeProviderConfig) {
    super(name, config)

    const schema = z.object({
      url: z.string().url(),
      udpRelay: z.boolean().optional(),
      tls13: z.boolean().optional(),
      compatibleMode: z.boolean().optional(),
      skipCertVerify: z.boolean().optional(),
    })
    const result = schema.safeParse(config)

    /* istanbul ignore next -- @preserve */
    if (!result.success) {
      throw new SurgioError('V2rayNSubscribeProvider 配置校验失败', {
        cause: result.error,
        providerName: name,
      })
    }

    this.#originalUrl = result.data.url
    this.compatibleMode = result.data.compatibleMode
    this.skipCertVerify = result.data.skipCertVerify
    this.tls13 = result.data.tls13
    this.udpRelay = result.data.udpRelay
  }

  /* istanbul ignore next -- @preserve */
  public get url(): string {
    return relayableUrl(this.#originalUrl, this.config.relayUrl)
  }

  public getNodeList: GetNodeListFunction = async (params = {}) =>
    await this.#getNodeList(params)

  public getNodeListV2: GetNodeListV2Function = async (
    params = {},
  ): Promise<GetNodeListV2Result> => ({
    nodeList: await this.#getNodeList(params),
  })

  async #getNodeList(params: GetNodeListParams) {
    const { nodeList } = await this.#getSubscription(params)

    if (this.config.hooks?.afterNodeListResponse) {
      const newList = await this.config.hooks.afterNodeListResponse(
        nodeList,
        params,
      )
      if (newList) return newList
    }

    return nodeList
  }

  async #getSubscription(params: GetNodeListParams = {}) {
    const requestHeaders = this.determineRequestHeaders(
      params.requestUserAgent,
      params.requestHeaders,
    )
    const cacheKey = Provider.getResourceCacheKey(requestHeaders, this.url)
    return await getV2rayNSubscriptionResult({
      url: this.url,
      skipCertVerify: this.skipCertVerify,
      tls13: this.tls13,
      udpRelay: this.udpRelay,
      isCompatibleMode: this.compatibleMode,
      requestHeaders,
      cacheKey,
      runtime: this.runtime,
    })
  }
}

export interface GetV2rayNSubscriptionOptions extends Omit<
  ParseV2rayNSubscriptionOptions,
  'logger'
> {
  readonly url: string
  readonly requestHeaders: DefaultProviderRequestHeaders
  readonly cacheKey: string
  readonly runtime?: ProviderRuntimeContext
}

export interface V2rayNSubscriptionResult {
  readonly nodeList: PossibleNodeConfigType[]
  readonly subscriptionUserInfo?: SubscriptionUserinfo
}

/**
 * Fetch and parse a v2rayN subscription without applying Provider hooks.
 * TrojanProvider uses the same entry point with an allowed node type filter.
 */
export const getV2rayNSubscriptionResult = async ({
  url,
  isCompatibleMode,
  skipCertVerify,
  tls13,
  udpRelay,
  allowedNodeTypes,
  requestHeaders,
  cacheKey,
  runtime,
}: GetV2rayNSubscriptionOptions): Promise<V2rayNSubscriptionResult> => {
  assert(url, '未指定订阅地址 url')
  const runtimeLogger = runtime?.logger ?? logger

  if (isCompatibleMode) {
    runtimeLogger.warn('运行在兼容模式，请注意生成的节点是否正确。')
  }

  const response = await Provider.requestCacheableResource(
    url,
    requestHeaders,
    cacheKey,
    runtime,
  )
  return {
    nodeList: parseV2rayNSubscription(response.body, {
      isCompatibleMode,
      skipCertVerify,
      tls13,
      udpRelay,
      allowedNodeTypes,
      logger: runtimeLogger,
    }),
    subscriptionUserInfo: response.subscriptionUserInfo,
  }
}

/**
 * @see https://github.com/2dust/v2rayN/wiki/Description-of-subscription
 */
export const getV2rayNSubscription = async (
  options: GetV2rayNSubscriptionOptions,
): Promise<PossibleNodeConfigType[]> =>
  (await getV2rayNSubscriptionResult(options)).nodeList
