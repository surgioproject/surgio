import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/libs/shadcn'

const badgeVariants = cva(
  'inline-flex items-center border rounded-full px-2.5 py-0.5 text-xs font-semibold',
  {
    variants: {
      variant: {
        default: 'bg-primary border-transparent text-primary-foreground',
        secondary: 'bg-secondary border-transparent text-secondary-foreground',
        destructive:
          'bg-destructive border-transparent text-destructive-foreground',
        outline: 'text-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
