import ArtifactParamsPopover from '@/components/ArtifactParamsPopover'
import ArtifactShareButton from '@/components/ArtifactShareButton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getDownloadUrl } from '@/libs/utils'
import { cn } from '@/libs/shadcn'
import { useDownloadToken } from '@/stores'
import { observer } from 'mobx-react-lite'
import React, { useId, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { ArtifactConfig } from 'surgio/internal'

import ArtifactActionButtons from '../ArtifactActionButtons'
import ArtifactCopyButtons from '../ArtifactCopyButtons'
import QrCodeButton from '../QrCodeButton'

interface ArtifactCardProps {
  artifact: ArtifactConfig
  isEmbed?: boolean
  artifactParams?: URLSearchParams
}

function ArtifactCard({
  artifact,
  isEmbed,
  artifactParams,
}: ArtifactCardProps) {
  const providers = [artifact.provider].concat(artifact.combineProviders || [])
  const downloadToken = useDownloadToken()
  const formatSelectId = useId()
  const downloadUrl = useMemo(
    () => getDownloadUrl(artifact.name, false, downloadToken, artifactParams),
    [artifact.name, artifactParams, downloadToken]
  )
  const previewUrl = useMemo(
    () => getDownloadUrl(artifact.name, true, downloadToken, artifactParams),
    [artifact.name, artifactParams, downloadToken]
  )
  const extraParams = useMemo(() => {
    const pairs: [string, string][] = []
    if (!artifactParams) {
      return pairs
    }
    for (const [key, value] of artifactParams.entries()) {
      pairs.push([key, value])
    }
    return pairs
  }, [artifactParams])

  return (
    <Card className={cn('flex flex-col', isEmbed && `w-full`)}>
      <CardHeader className="gap-3 space-y-0">
        <div className="flex items-center gap-3">
          <CardTitle className="flex-1 truncate text-lg" title={artifact.name}>
            {artifact.name}
          </CardTitle>
          {extraParams.length > 0 && (
            <ArtifactParamsPopover params={extraParams} />
          )}
        </div>

        {artifact.categories && (
          <div className="flex flex-wrap gap-1.5" aria-label="分类">
            {artifact.categories.map((cat) => (
              <Badge
                data-testid="display-category-item"
                variant="outline"
                key={cat}
              >
                {cat}
              </Badge>
            ))}
          </div>
        )}
      </CardHeader>

      <CardContent className="flex-1 space-y-6">
        <div data-testid="display-provider-list" className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground">
            Providers
          </div>
          <div className="flex flex-wrap gap-1.5">
            {providers.map((item) => (
              <Badge
                data-testid="display-provider-item"
                variant="secondary"
                key={item}
              >
                {item}
              </Badge>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ArtifactActionButtons
            artifact={artifact}
            artifactParams={artifactParams}
          />

          <Button variant="outline" asChild>
            <a
              data-testid="download-button"
              target="_blank"
              rel="nofollow noreferrer"
              href={downloadUrl}
            >
              下载
            </a>
          </Button>

          <Button variant="outline" asChild>
            <a
              data-testid="preview-button"
              target="_blank"
              rel="nofollow noreferrer"
              href={previewUrl}
            >
              预览
            </a>
          </Button>

          <QrCodeButton text={previewUrl} />

          {isEmbed ? null : <ArtifactShareButton artifact={artifact} />}
        </div>
      </CardContent>

      <div className="space-y-2 border-t px-6 py-4">
        <Label htmlFor={formatSelectId}>复制订阅地址</Label>
        <ArtifactCopyButtons
          artifact={artifact}
          artifactParams={artifactParams}
          selectId={formatSelectId}
        />
      </div>
    </Card>
  )
}

export default observer(ArtifactCard)
