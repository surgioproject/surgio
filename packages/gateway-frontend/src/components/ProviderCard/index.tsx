import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import React, { useState } from 'react'
import { useSnackbar } from 'notistack'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

import { Provider, type SubscriptionUserInfo } from '../../libs/types'
import { defaultFetcher } from '../../libs/utils'
import ProviderCopyButtons from '../ProviderCopyButtons'

export interface ProviderCardProps {
  provider: Provider
}

function ProviderCard({ provider }: ProviderCardProps) {
  const { enqueueSnackbar } = useSnackbar()
  const [isLoading, setIsLoading] = useState(false)

  const checkSubscription = (providerName: string) => {
    ;(async () => {
      setIsLoading(true)

      const data = await defaultFetcher<SubscriptionUserInfo | null>(
        `/api/providers/${providerName}/subscription`
      )

      if (data) {
        enqueueSnackbar(
          `🤟 已用流量：${data.used} 剩余流量：${data.left} 有效期至：${data.expire}`,
          { variant: 'success' }
        )
      } else {
        enqueueSnackbar('该 Provider 不支持查询', { variant: 'error' })
      }
    })()
      .catch(() => {
        enqueueSnackbar('网络问题', { variant: 'error' })
      })
      .finally(() => {
        setIsLoading(false)
      })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">{provider.name}</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <div>
          <Badge className="capitalize">{provider.type}</Badge>
        </div>

        {provider.url ? (
          <div className="bg-secondary text-secondary-foreground rounded">
            <pre className="overflow-x-scroll p-4 text-sm">{provider.url}</pre>
          </div>
        ) : null}

        {provider.supportGetSubscriptionUserInfo ? (
          <div>
            <Button
              disabled={isLoading}
              onClick={() => checkSubscription(provider.name)}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  查询中…
                </>
              ) : (
                '查询流量'
              )}
            </Button>
          </div>
        ) : null}

        <Separator className="my-4" />

        <div className="space-y-2">
          <div className="font-semibold">复制订阅地址</div>
          <ProviderCopyButtons providerNameList={[provider.name]} />
        </div>
      </CardContent>
    </Card>
  )
}

export default ProviderCard
