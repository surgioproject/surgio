import React from 'react'
import useSWR from 'swr'
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import LoadError from '@/components/LoadError'
import ProviderCard from '@/components/ProviderCard'
import { Provider } from '@/libs/types'
import { defaultFetcher } from '@/libs/utils'

const gridClassName =
  'mt-6 lg:mt-8 grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8'

const Page: React.FC = () => {
  const {
    data: providerList,
    error,
    isValidating,
    mutate,
  } = useSWR<ReadonlyArray<Provider>>('/api/providers', defaultFetcher)

  const renderList = () => {
    if (error) {
      return (
        <LoadError
          className="mt-6 lg:mt-8"
          title="Provider 列表加载失败"
          isRetrying={isValidating}
          onRetry={() => void mutate()}
        />
      )
    }
    if (!providerList) {
      return <ProviderListSkeleton />
    }
    if (providerList.length === 0) {
      return <ProviderListEmpty />
    }
    return (
      <div className={gridClassName}>
        {providerList.map((provider) => (
          <ProviderCard key={provider.name} provider={provider} />
        ))}
      </div>
    )
  }

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Providers</CardTitle>
        </CardHeader>
      </Card>

      {renderList()}
    </div>
  )
}

// Heights match a rendered provider card so the grid does not jump on load.
function ProviderListSkeleton() {
  return (
    <div className={gridClassName} aria-busy="true" aria-label="加载中">
      {Array.from({ length: 4 }, (_, index) => (
        <Skeleton key={index} className="h-[231px] rounded-lg" />
      ))}
    </div>
  )
}

function ProviderListEmpty() {
  return (
    <Card className="mt-6 lg:mt-8">
      <CardHeader>
        <CardTitle className="text-lg">还没有 Provider</CardTitle>
        <CardDescription>
          在 Surgio 项目的 <code>provider</code>{' '}
          目录中添加配置，然后刷新此页面。
        </CardDescription>
      </CardHeader>
    </Card>
  )
}

export default Page
