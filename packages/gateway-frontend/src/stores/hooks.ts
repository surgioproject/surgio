import React from 'react'

import { StoresContext } from './'

export const useStores = () => React.useContext(StoresContext)

export const useDownloadToken = () => {
  const { config: configStore } = useStores()

  return (
    configStore.config.viewerToken || configStore.config.accessToken || null
  )
}
