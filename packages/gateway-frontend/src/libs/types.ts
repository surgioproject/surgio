export interface Provider {
  name: string
  type: string
  url?: string
  supportGetSubscriptionUserInfo: boolean
  username?: string
}

export interface SubscriptionUserInfo {
  readonly upload: string
  readonly download: string
  readonly used: string
  readonly left: string
  readonly total: string
  readonly expire: string
}
