import { AlertCircleIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { cn } from '@/libs/shadcn'

export interface LoadErrorProps {
  title: string
  isRetrying: boolean
  onRetry: () => void
  className?: string
}

export default function LoadError({
  title,
  isRetrying,
  onRetry,
  className,
}: LoadErrorProps) {
  return (
    <Card className={cn('w-full', className)} role="alert">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <AlertCircleIcon className="size-5 shrink-0 text-destructive" />
          {title}
        </CardTitle>
        <CardDescription>
          确认网关正在运行且访问凭证有效后重试。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={onRetry} disabled={isRetrying}>
          {isRetrying ? '重试中…' : '重试'}
        </Button>
      </CardContent>
    </Card>
  )
}
