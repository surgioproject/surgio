import {
  INTERNET_TEST_INTERVAL,
  INTERNET_TEST_URL,
  PROXY_TEST_INTERVAL,
  PROXY_TEST_URL,
} from './constant/index.js'

import type { CommandConfigBeforeNormalize } from './types.js'

export const normalizeCommonConfig = (
  input: Partial<CommandConfigBeforeNormalize>,
) => {
  const urlBase = input.urlBase || '/'
  const passRequestHeaders = [...(input.gateway?.passRequestHeaders ?? [])]
  if (
    input.gateway?.passRequestUserAgent &&
    !passRequestHeaders.includes('user-agent')
  ) {
    passRequestHeaders.push('user-agent')
  }

  return {
    ...input,
    artifacts: input.artifacts ?? [],
    urlBase,
    publicUrl: /^https?:/i.test(urlBase) ? new URL(urlBase).origin + '/' : '/',
    surgeConfig: {
      vmessAEAD: true,
      ...input.surgeConfig,
    },
    clashConfig: {
      enableShadowTls: false,
      enableTuic: false,
      enableHysteria2: false,
      enableVless: false,
      clashCore: 'clash.meta' as const,
      ...input.clashConfig,
    },
    quantumultXConfig: { vmessAEAD: true, ...input.quantumultXConfig },
    surfboardConfig: { vmessAEAD: true, ...input.surfboardConfig },
    proxyTestUrl: input.proxyTestUrl ?? PROXY_TEST_URL,
    proxyTestInterval: input.proxyTestInterval ?? PROXY_TEST_INTERVAL,
    internetTestUrl: input.internetTestUrl ?? INTERNET_TEST_URL,
    internetTestInterval: input.internetTestInterval ?? INTERNET_TEST_INTERVAL,
    checkHostname: input.checkHostname ?? false,
    resolveHostname: input.resolveHostname ?? false,
    gateway: input.gateway
      ? { ...input.gateway, passRequestHeaders }
      : { passRequestUserAgent: false, passRequestHeaders: [] },
  }
}
