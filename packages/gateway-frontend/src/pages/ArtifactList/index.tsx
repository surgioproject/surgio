import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import React, { useMemo } from 'react'
import useSWR from 'swr'
import { ArtifactConfig } from 'surgio/internal'
import { defaultFetcher } from '@/libs/utils'
import ArtifactCard from '@/components/ArtifactCard'
import LoadError from '@/components/LoadError'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'

const gridClassName =
  'mt-6 lg:mt-8 grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8'

const Page = (): React.JSX.Element => {
  const {
    data: artifactList,
    error,
    isValidating,
    mutate,
  } = useSWR<ReadonlyArray<ArtifactConfig>>('/api/artifacts', defaultFetcher)
  const [categorySelection, setCategorySelection] = React.useState<{
    [key: string]: boolean
  }>({})
  const categories = useMemo(
    () =>
      Array.from(
        new Set(artifactList?.flatMap((artifact) => artifact.categories ?? []))
      ),
    [artifactList]
  )

  const handleCategoryChange = (name: string) => (checked: boolean) => {
    setCategorySelection({
      ...categorySelection,
      [name]: checked,
    })
  }

  const selectedCategories = categories.filter((cat) => categorySelection[cat])
  const visibleArtifacts =
    selectedCategories.length > 0
      ? artifactList?.filter((artifact) =>
          artifact.categories?.some((cat) => selectedCategories.includes(cat))
        )
      : artifactList

  const renderList = () => {
    if (error) {
      return (
        <LoadError
          className="mt-6 lg:mt-8"
          title="Artifact 列表加载失败"
          isRetrying={isValidating}
          onRetry={() => void mutate()}
        />
      )
    }
    if (!visibleArtifacts) {
      return <ArtifactListSkeleton />
    }
    if (visibleArtifacts.length === 0) {
      return <ArtifactListEmpty />
    }
    return (
      <div className={gridClassName}>
        {visibleArtifacts.map((artifact) => (
          <ArtifactCard key={artifact.name} artifact={artifact} />
        ))}
      </div>
    )
  }

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Artifacts</CardTitle>
        </CardHeader>

        {categories.length > 0 && (
          <CardContent>
            <div
              role="group"
              aria-labelledby="artifact-category-filter"
              className="flex flex-wrap items-center gap-x-5"
            >
              <span
                id="artifact-category-filter"
                className="text-sm text-muted-foreground"
              >
                按分类筛选
              </span>
              {categories.map((cat) => (
                <label
                  key={cat}
                  htmlFor={`cb-${cat}`}
                  className="flex min-h-10 cursor-pointer items-center gap-2 text-sm"
                >
                  <Checkbox
                    id={`cb-${cat}`}
                    checked={categorySelection[cat] ?? false}
                    onCheckedChange={(val) =>
                      handleCategoryChange(cat)(val === true)
                    }
                    value={cat}
                  />
                  {cat}
                </label>
              ))}
            </div>
          </CardContent>
        )}
      </Card>

      {renderList()}
    </div>
  )
}

// Heights match a rendered artifact card so the grid does not jump on load.
function ArtifactListSkeleton() {
  return (
    <div className={gridClassName} aria-busy="true" aria-label="加载中">
      {Array.from({ length: 4 }, (_, index) => (
        <Skeleton key={index} className="h-[342px] rounded-lg" />
      ))}
    </div>
  )
}

function ArtifactListEmpty() {
  return (
    <Card className="mt-6 lg:mt-8">
      <CardHeader>
        <CardTitle className="text-lg">还没有 Artifact</CardTitle>
        <CardDescription>
          在 Surgio 项目配置的 <code>artifacts</code>{' '}
          中添加配置，然后刷新此页面。
        </CardDescription>
      </CardHeader>
    </Card>
  )
}

export default Page
