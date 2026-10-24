import React from 'react'

import { ConfigStore } from './config'
export * from './hooks'

export const stores = {
  config: new ConfigStore(),
}

export const StoresContext = React.createContext(stores)
