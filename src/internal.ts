import { loadConfig, setConfig, getConfig } from './config'
import { loadRemoteSnippetList } from './utils/remote-snippet'

export * as redis from './redis'
export * from './types'

const utils = {
  loadRemoteSnippetList,
} as const

const config = {
  loadConfig,
  setConfig,
  getConfig,
} as const

export { utils, config }
