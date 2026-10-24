import { useDownloadToken } from '@/stores'
import { ClipboardCopyIcon } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { useSnackbar } from 'notistack'
import React from 'react'
import { Button } from '@/components/ui/button'
import CopyButton from '@/components/CopyButton'
import { ArtifactConfig } from 'surgio/internal'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

const ArtifactShareButton = ({ artifact }: { artifact: ArtifactConfig }) => {
  const { enqueueSnackbar } = useSnackbar()

  const downloadToken = useDownloadToken()
  const embedCode = getEmbedCode(artifact.name, downloadToken)
  const embedUrl = getEmbedUrl(artifact.name, downloadToken)

  const onCopySuccess = () => {
    enqueueSnackbar('复制成功', { variant: 'success' })
  }

  const onCopyError = () => {
    enqueueSnackbar('复制失败', { variant: 'error' })
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost">分享</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>分享 Artifact</DialogTitle>
          <DialogDescription>
            请不要将这个链接分享给不信任的人，它包含了访问你的配置文件的凭证。
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-hidden">
          <ul className="divide-dashed divide-y">
            <li className="space-y-1 py-2">
              <div className="font-semibold">Embed HTML 代码</div>
              <div className="relative bg-secondary text-secondary-foreground pl-4 pr-[60px] rounded">
                <pre id="embed-html" className="overflow-x-scroll py-4 text-sm">
                  {embedCode}
                </pre>
                <div className="absolute right-3 top-0 bottom-0 flex items-center">
                  <CopyButton
                    text={embedCode}
                    data-testid="copy-button"
                    onSuccess={onCopySuccess}
                    onError={onCopyError}
                    variant="outline"
                    className="p-2"
                  >
                    <ClipboardCopyIcon size={16} className="fill-secondary" />
                  </CopyButton>
                </div>
              </div>
            </li>
            <li className="space-y-1 py-2">
              <div className="font-semibold">直接访问地址</div>
              <div className="relative bg-secondary text-secondary-foreground pl-4 pr-[60px] rounded">
                <pre
                  id="embed-page-url"
                  className="overflow-x-scroll py-4 text-sm"
                >
                  {embedUrl}
                </pre>
                <div className="absolute right-3 top-0 bottom-0 flex items-center">
                  <CopyButton
                    text={embedUrl}
                    data-testid="copy-button"
                    onSuccess={onCopySuccess}
                    onError={onCopyError}
                    variant="outline"
                    className="p-2"
                  >
                    <ClipboardCopyIcon size={16} className="fill-secondary" />
                  </CopyButton>
                </div>
              </div>
            </li>
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function getEmbedCode(artifact: string, accessToken?: string | null): string {
  return `<iframe loading="lazy" src="${getEmbedUrl(
    artifact,
    accessToken
  )}" height="480px" width="100%"></iframe>`
}

function getEmbedUrl(artifact: string, accessToken?: string | null): string {
  const url = new URL(`/embed/artifact/${artifact}`, window.location.origin)

  if (accessToken) {
    url.searchParams.set('access_token', accessToken)
  }

  return url.toString()
}

export default observer(ArtifactShareButton)
