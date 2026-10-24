import CopyButton from '@/components/CopyButton'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { observer } from 'mobx-react-lite'
import { useSnackbar } from 'notistack'
import React, { useState, useMemo } from 'react'
import { ArtifactConfig } from 'surgio/internal'
import { CATEGORIES } from 'surgio/constant'
import { getDownloadUrl } from '@/libs/utils'
import { useDownloadToken } from '@/stores'

export interface ArtifactCopyButtonsProps {
  artifact: ArtifactConfig
  artifactParams?: URLSearchParams
  selectId?: string
}

function ArtifactCopyButtons({
  artifact,
  artifactParams,
  selectId,
}: ArtifactCopyButtonsProps) {
  const downloadToken = useDownloadToken()
  const formatOptions = useMemo(
    () =>
      [
        {
          name: '原始格式',
          url: getDownloadUrl(
            artifact.name,
            true,
            downloadToken,
            artifactParams
          ),
        },
        {
          name: 'Surge Policy',
          url: getDownloadUrl(
            `${artifact.name}?format=surge-policy`,
            true,
            downloadToken,
            artifactParams
          ),
        },
        {
          name: 'Clash Provider',
          url: getDownloadUrl(
            `${artifact.name}?format=clash-provider`,
            true,
            downloadToken,
            artifactParams
          ),
        },
        {
          name: 'Quantumult X Server Remote',
          url: getDownloadUrl(
            `${artifact.name}?format=qx-server`,
            true,
            downloadToken,
            artifactParams
          ),
        },
        {
          name: 'Loon Proxy',
          url: getDownloadUrl(
            `${artifact.name}?format=loon`,
            true,
            downloadToken,
            artifactParams
          ),
        },
        {
          name: 'SS 订阅',
          url: getDownloadUrl(
            `${artifact.name}?format=ss`,
            true,
            downloadToken,
            artifactParams
          ),
        },
        {
          name: 'SSR 订阅',
          url: getDownloadUrl(
            `${artifact.name}?format=ssr`,
            true,
            downloadToken,
            artifactParams
          ),
        },
        {
          name: 'V2RayN 订阅',
          url: getDownloadUrl(
            `${artifact.name}?format=v2ray`,
            true,
            downloadToken,
            artifactParams
          ),
        },
      ] as const,
    [artifact.name, artifactParams, downloadToken]
  )
  const [selectedFormat, setSelectedFormat] = useState<string>(
    formatOptions[0].name
  )
  const isSnippet = artifact.categories?.includes(CATEGORIES.SNIPPET) || false
  const selectedUrl = useMemo(() => {
    return formatOptions.find((option) => option.name === selectedFormat)?.url
  }, [formatOptions, selectedFormat])

  const { enqueueSnackbar } = useSnackbar()

  const onCopySuccess = () => {
    enqueueSnackbar('复制成功', { variant: 'success' })
  }

  const onCopyError = () => {
    enqueueSnackbar('复制失败', { variant: 'error' })
  }

  return (
    <div className="flex gap-2">
      <Select
        value={selectedFormat}
        disabled={isSnippet}
        onValueChange={(val) => setSelectedFormat(val)}
      >
        <SelectTrigger
          id={selectId}
          className="min-w-0 flex-1 sm:w-64 sm:flex-none"
          data-testid="format-select"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {formatOptions.map((option) => (
              <SelectItem key={option.name} value={option.name}>
                {option.name}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>

      <CopyButton
        text={selectedUrl || ''}
        data-testid="copy-button"
        onSuccess={onCopySuccess}
        onError={onCopyError}
        variant="secondary"
      >
        复制
      </CopyButton>
    </div>
  )
}

export default observer(ArtifactCopyButtons)
