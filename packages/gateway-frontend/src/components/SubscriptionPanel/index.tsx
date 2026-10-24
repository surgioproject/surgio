import React from 'react'
import useSWR from 'swr'
import uniqWith from 'lodash-es/uniqWith'
import { Provider } from '@/libs/types'
import { defaultFetcher } from '@/libs/utils'
import LoadError from '@/components/LoadError'
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

import SubscriptionPanelItem from './SubscriptionPanelItem'

export interface SubscriptionPanelItemProps {
  provider: Provider
}

function SubscriptionPanel() {
  const {
    data: providerList,
    error,
    isValidating,
    mutate,
  } = useSWR<ReadonlyArray<Provider>>('/api/providers', defaultFetcher)

  if (error) {
    return (
      <LoadError
        title="订阅信息加载失败"
        isRetrying={isValidating}
        onRetry={() => void mutate()}
      />
    )
  }

  if (!providerList) {
    return <SubscriptionPanelSkeleton />
  }

  const supportedProviderList = uniqWith(
    providerList.filter((provider) => {
      if (provider.type === 'blackssl') {
        return provider.supportGetSubscriptionUserInfo
      } else {
        return provider.supportGetSubscriptionUserInfo && provider.url
      }
    }),
    (provider, other) => {
      if (provider.type === 'blackssl' && other.type === 'blackssl') {
        return provider.username === other.username
      } else if (other.type !== 'blackssl') {
        return provider.url === other.url
      }
      return false
    }
  )

  return (
    <>
      <PanelTitle />

      {supportedProviderList.length === 0 ? (
        <Card className="mt-3 lg:mt-4">
          <CardHeader>
            <CardTitle className="text-lg">没有可查询流量的订阅</CardTitle>
            <CardDescription>
              支持查询订阅信息的 Provider 会显示在这里。
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className={gridClassName}>
          {supportedProviderList.map((provider: Provider) => {
            return (
              <div key={provider.name}>
                <SubscriptionPanelItem provider={provider} />
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}

const gridClassName =
  'mt-3 lg:mt-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 lg:gap-4'

function PanelTitle() {
  return <h2 className="font-semibold tracking-tight text-xl">订阅</h2>
}

// Heights match a rendered subscription card so the grid does not jump on load.
function SubscriptionPanelSkeleton() {
  return (
    <>
      <PanelTitle />
      <div className={gridClassName} aria-busy="true" aria-label="加载中">
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton key={index} className="h-[231px] rounded-lg" />
        ))}
      </div>
    </>
  )
}

export default SubscriptionPanel
