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
import React, { useMemo, useState } from 'react'
import { getExportProviderUrl } from '@/libs/utils'
import { useDownloadToken } from '@/stores'

export interface ProviderCopyButtonsProps {
  providerNameList: ReadonlyArray<string>
}

function ProviderCopyButtons({ providerNameList }: ProviderCopyButtonsProps) {
  const { enqueueSnackbar } = useSnackbar()

  const providers = useMemo(
    () => providerNameList.join(','),
    [providerNameList]
  )

  const downloadToken = useDownloadToken()
  const formatOptions = useMemo(
    () =>
      [
        {
          name: 'Surge Policy',
          url: getExportProviderUrl(
            providers,
            'surge-policy',
            true,
            downloadToken
          ),
        },
        {
          name: 'Clash Provider',
          url: getExportProviderUrl(
            providers,
            'clash-provider',
            true,
            downloadToken
          ),
        },
        {
          name: 'Quantumult X Server Remote',
          url: getExportProviderUrl(
            providers,
            'qx-server',
            true,
            downloadToken
          ),
        },
        {
          name: 'Loon Proxy',
          url: getExportProviderUrl(providers, 'loon', true, downloadToken),
        },
        {
          name: 'SS 订阅',
          url: getExportProviderUrl(providers, 'ss', true, downloadToken),
        },
        {
          name: 'SSR 订阅',
          url: getExportProviderUrl(providers, 'ssr', true, downloadToken),
        },
        {
          name: 'V2RayN 订阅',
          url: getExportProviderUrl(providers, 'v2ray', true, downloadToken),
        },
      ] as const,
    [downloadToken, providers]
  )
  const [selectedFormat, setSelectedFormat] = useState<string>(
    formatOptions[0].name
  )
  const selectedUrl = useMemo(() => {
    return formatOptions.find((option) => option.name === selectedFormat)?.url
  }, [formatOptions, selectedFormat])

  const onCopySuccess = () => {
    enqueueSnackbar('复制成功', { variant: 'success' })
  }

  const onCopyError = () => {
    enqueueSnackbar('复制失败', { variant: 'error' })
  }

  return (
    <div className="flex space-x-4">
      <Select
        value={selectedFormat}
        onValueChange={(val) => setSelectedFormat(val)}
      >
        <SelectTrigger
          className="w-[150px] sm:w-[180px]"
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

export default observer(ProviderCopyButtons)
