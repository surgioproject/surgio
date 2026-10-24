import { action, computed, makeObservable, observable } from 'mobx'

export interface Config {
  urlBase: string
  publicUrl: string
  backendVersion: string
  coreVersion: string
  accessToken: string | null
  viewerToken: string | null
}

export class ConfigStore {
  config: Config = {
    urlBase: '',
    publicUrl: '',
    backendVersion: '',
    coreVersion: '',
    accessToken: null,
    viewerToken: null,
  }

  constructor() {
    makeObservable(this, {
      config: observable,
      updateConfig: action,
      isReady: computed,
    })
  }

  updateConfig(newConfig: Partial<Config>) {
    Object.assign(this.config, newConfig)
  }

  get isReady(): boolean {
    return !!this.config.backendVersion
  }
}
