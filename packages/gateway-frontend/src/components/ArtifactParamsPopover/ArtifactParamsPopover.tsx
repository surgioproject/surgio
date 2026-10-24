import React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { InfoIcon } from 'lucide-react'

const ArtifactParamsPopover = ({ params }: { params: [string, string][] }) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-10 rounded-full p-0">
          <InfoIcon className="h-4 w-4" />
          <span className="sr-only">查看额外参数</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" side="left" sideOffset={10}>
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">额外携带的参数</h4>
            <p className="text-sm text-muted-foreground">
              以下的 URL 参数会被传递到 <code>customParams</code> 中。
            </p>
          </div>
          <div className="grid gap-2">
            {params.map(([key, value]) => (
              <div key={key} className="grid grid-cols-3 items-center gap-4">
                <Label className="overflow-ellipsis truncate" title={key}>
                  <code>{key}</code>
                </Label>
                <Input
                  className="col-span-2 h-8 font-mono overflow-auto"
                  disabled
                  value={value}
                />
              </div>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export default ArtifactParamsPopover
