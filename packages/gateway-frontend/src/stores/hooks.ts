import React from 'react'

import { StoresContext } from './'
import type { ConfigStore } from './config'

export const useStores = () => React.use(StoresContext)

const getShareToken = (configStore: ConfigStore) =>
  configStore.config.viewerToken || configStore.config.accessToken || null

export const useDownloadToken = () => {
  const { config: configStore } = useStores()

  return configStore.config.urlAccessToken || getShareToken(configStore)
}

// An admin token from the URL must not leak into links shared with others.
// With an authProvider every visitor signs in on their own, so shared links carry no token.
export const useShareToken = () => {
  const { config: configStore } = useStores()

  return configStore.config.hasAuthProvider ? null : getShareToken(configStore)
}
