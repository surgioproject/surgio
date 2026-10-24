import React from 'react'
import { ArtifactConfig } from 'surgio/internal'
import useSWR from 'swr'
import { useParams, useLocation } from 'react-router-dom'
import ArtifactCard from '@/components/ArtifactCard'
import LoadError from '@/components/LoadError'
import { Skeleton } from '@/components/ui/skeleton'
import { defaultFetcher } from '@/libs/utils'

const Page: React.FC = () => {
  const { artifactName } = useParams<{ artifactName: string }>()
  const location = useLocation()
  const artifactParams = new URLSearchParams(location.search)
  const {
    data: artifact,
    error,
    isValidating,
    mutate,
  } = useSWR<ArtifactConfig>(`/api/artifacts/${artifactName}`, defaultFetcher)

  ;['dl', 'access_token'].forEach((key) => {
    artifactParams.delete(key)
  })

  const renderContent = () => {
    if (error) {
      return (
        <LoadError
          title="Artifact 加载失败"
          isRetrying={isValidating}
          onRetry={() => void mutate()}
        />
      )
    }
    if (!artifact) {
      return (
        <Skeleton
          className="h-[342px] w-full rounded-lg"
          aria-busy="true"
          aria-label="加载中"
        />
      )
    }
    return (
      <ArtifactCard
        artifact={artifact}
        isEmbed
        artifactParams={artifactParams}
      />
    )
  }

  return (
    <div className="fixed top-0 left-0 right-0 bottom-0 w-full h-full flex justify-center items-center bg-white dark:bg-gray-800">
      {renderContent()}
    </div>
  )
}

export default Page
