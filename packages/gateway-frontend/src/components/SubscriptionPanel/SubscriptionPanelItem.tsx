import { SubscriptionPanelItemProps } from '@/components/SubscriptionPanel/index'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { AlertCircleIcon } from 'lucide-react'
import { defaultFetcher } from '@/libs/utils'
import type { SubscriptionUserInfo } from '@/libs/types'
import React from 'react'
import useSWR from 'swr'

function SubscriptionPanelItem({ provider }: SubscriptionPanelItemProps) {
  const { data, error, isValidating, mutate } =
    useSWR<SubscriptionUserInfo | null>(
      `/api/providers/${provider.name}/subscription`,
      defaultFetcher
    )

  if (error) {
    return (
      <Card className="h-full">
        <SubscriptionCardHeader name={provider.name} />
        <CardContent className="space-y-3" role="alert">
          <div className="flex items-center gap-2 text-sm">
            <AlertCircleIcon className="size-4 shrink-0 text-destructive" />
            流量信息加载失败
          </div>
          <Button
            size="sm"
            variant="outline"
            disabled={isValidating}
            onClick={() => void mutate()}
          >
            {isValidating ? '重试中…' : '重试'}
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (typeof data === 'undefined') {
    return (
      <Card className="h-full" aria-busy="true">
        <SubscriptionCardHeader name={provider.name} />
        <CardContent>
          <Skeleton className="h-5 w-16" />
          <Skeleton className="mt-1 h-9 w-44" />
          <div className={detailListClassName}>
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (data === null) {
    return <></>
  }

  return (
    <Card className="h-full">
      <SubscriptionCardHeader name={provider.name} />
      <CardContent>
        <p className="text-sm text-muted-foreground">剩余流量</p>
        <p className="mt-1 flex flex-wrap items-baseline gap-x-2">
          <span className="text-3xl font-semibold tracking-tight tabular-nums">
            {data.left}
          </span>
          <span className="text-sm text-muted-foreground tabular-nums">
            共 {data.total}
          </span>
        </p>
        <dl className={detailListClassName}>
          <DetailRow label="已用流量" value={data.used} />
          <DetailRow label="有效期至" value={data.expire} />
        </dl>
      </CardContent>
    </Card>
  )
}

// Loading and loaded states share this spacing so the card keeps its height.
const detailListClassName = 'mt-4 space-y-2 border-t pt-4 text-sm'

function SubscriptionCardHeader({ name }: { name: string }) {
  return (
    <CardHeader className="pb-4">
      <CardTitle className="text-base">{name}</CardTitle>
    </CardHeader>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd className="text-right tabular-nums">{value}</dd>
    </div>
  )
}

export default SubscriptionPanelItem
