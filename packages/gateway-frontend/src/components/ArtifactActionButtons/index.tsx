import { Button } from '@/components/ui/button'
import { observer } from 'mobx-react-lite'
import React from 'react'
import { ArtifactConfig } from 'surgio/internal'
import { CATEGORIES } from 'surgio/constant'
import { JsonObject } from 'type-fest'
import { getDownloadUrl } from '@/libs/utils'
import { useDownloadToken } from '@/stores'

export interface ArtifactActionButtonsProps {
  artifact: ArtifactConfig
  artifactParams?: URLSearchParams
}

function ArtifactActionButtons({
  artifact,
  artifactParams,
}: ArtifactActionButtonsProps) {
  const downloadToken = useDownloadToken()
  const previewUrl = getDownloadUrl(
    artifact.name,
    true,
    downloadToken,
    artifactParams
  )
  const name = artifact.name.toLowerCase()
  const categories = artifact.categories ?? []
  const quantumultXResource = getQuantumultXResource(categories, previewUrl)

  return (
    <div data-testid="action-buttons" className="contents">
      {(name.includes('surge') || categories.includes(CATEGORIES.SURGE)) && (
        <ActionLink
          href={`surge:///install-config?url=${encodeURIComponent(previewUrl)}`}
          label="添加到 Surge"
        />
      )}
      {(name.includes('clash') || categories.includes(CATEGORIES.CLASH)) && (
        <ActionLink
          href={`clash://install-config?url=${encodeURIComponent(previewUrl)}`}
          label="添加到 ClashX/CFW"
        />
      )}
      {quantumultXResource && (
        <ActionLink
          data-testid={`quanx-${quantumultXResource.type}`}
          href={`quantumult-x:///add-resource?remote-resource=${encodeURIComponent(
            JSON.stringify(quantumultXResource.value)
          )}`}
          label="添加到 Quantumult X"
        />
      )}
      {(name.includes('loon') || categories.includes(CATEGORIES.LOON)) && (
        <ActionLink
          href={`loon://import?sub=${encodeURIComponent(previewUrl)}`}
          label="添加到 Loon"
        />
      )}
      {(name.includes('surfboard') || categories.includes('Surfboard')) && (
        <ActionLink
          href={`surfboard:///install-config?url=${encodeURIComponent(
            previewUrl
          )}`}
          label="添加到 Surfboard"
        />
      )}
    </div>
  )
}

interface ActionLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string
  label: string
}

function ActionLink({ href, label, ...props }: ActionLinkProps) {
  return (
    <Button asChild>
      <a href={href} {...props}>
        {label}
      </a>
    </Button>
  )
}

function getQuantumultXResource(
  categories: ReadonlyArray<string>,
  previewUrl: string
): { type: string; value: JsonObject } | undefined {
  if (categories.includes(CATEGORIES.QUANTUMULT_X_SERVER)) {
    return { type: 'server-remote', value: { server_remote: [previewUrl] } }
  }

  if (categories.includes(CATEGORIES.QUANTUMULT_X_FILTER)) {
    return { type: 'filter-remote', value: { filter_remote: [previewUrl] } }
  }

  if (categories.includes(CATEGORIES.QUANTUMULT_X_REWRITE)) {
    return { type: 'rewrite-remote', value: { rewrite_remote: [previewUrl] } }
  }
}

export default observer(ArtifactActionButtons)
