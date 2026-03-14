import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90',
        destructive:
          'border-transparent bg-destructive text-white [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60',
        outline:
          'text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground',
        success:
          'border-transparent bg-success text-success-foreground [a&]:hover:bg-success/90',
        warning:
          'border-transparent bg-warning text-warning-foreground [a&]:hover:bg-warning/90',
        info:
          'border-transparent bg-info text-info-foreground [a&]:hover:bg-info/90',
        // Status-specific variants with subtle backgrounds
        pending:
          'border-warning/30 bg-warning/10 text-warning',
        approved:
          'border-success/30 bg-success/10 text-success',
        rejected:
          'border-destructive/30 bg-destructive/10 text-destructive',
        open:
          'border-success/30 bg-success/10 text-success',
        completed:
          'border-muted-foreground/30 bg-muted text-muted-foreground',
        cancelled:
          'border-destructive/30 bg-destructive/10 text-destructive',
        // Pulse variant for pending states
        pulse:
          'border-warning/30 bg-warning/10 text-warning animate-pulse',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

interface BadgeProps
  extends React.ComponentProps<'span'>,
    VariantProps<typeof badgeVariants> {
  asChild?: boolean
  dot?: boolean
  dotColor?: 'default' | 'success' | 'warning' | 'destructive' | 'info'
}

function Badge({
  className,
  variant,
  asChild = false,
  dot = false,
  dotColor = 'default',
  children,
  ...props
}: BadgeProps) {
  const Comp = asChild ? Slot : 'span'
  
  const dotColorClasses = {
    default: 'bg-primary',
    success: 'bg-success',
    warning: 'bg-warning',
    destructive: 'bg-destructive',
    info: 'bg-info',
  }

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    >
      {dot && (
        <span 
          className={cn(
            'h-1.5 w-1.5 rounded-full shrink-0',
            dotColorClasses[dotColor]
          )} 
        />
      )}
      {children}
    </Comp>
  )
}

export { Badge, badgeVariants }
