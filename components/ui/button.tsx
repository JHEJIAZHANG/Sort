import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-300 ease-out disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2 active:scale-95 hover:scale-105 touch-manipulation",
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground shadow-lg hover:bg-primary-hover hover:shadow-xl hover:shadow-primary/25 active:shadow-md',
        destructive:
          'bg-destructive text-destructive-foreground shadow-lg hover:bg-destructive-hover hover:shadow-xl hover:shadow-destructive/25 active:shadow-md',
        outline:
          'border border-input-border bg-background shadow-md hover:bg-secondary hover:text-secondary-foreground hover:border-primary/50 hover:shadow-lg',
        secondary:
          'bg-secondary text-secondary-foreground shadow-md hover:bg-secondary-hover hover:shadow-lg',
        ghost:
          'hover:bg-secondary/80 hover:text-secondary-foreground rounded-xl',
        link: 'text-primary underline-offset-4 hover:underline hover:text-primary-hover',
        success:
          'bg-success text-success-foreground shadow-lg hover:shadow-xl hover:shadow-success/25 active:shadow-md',
        warning:
          'bg-warning text-warning-foreground shadow-lg hover:shadow-xl hover:shadow-warning/25 active:shadow-md',
        info:
          'bg-info text-info-foreground shadow-lg hover:shadow-xl hover:shadow-info/25 active:shadow-md',
      },
      size: {
        default: 'h-10 px-4 py-2 has-[>svg]:px-3 min-w-[44px]',
        sm: 'h-8 rounded-lg gap-1.5 px-3 has-[>svg]:px-2.5 min-w-[36px]',
        lg: 'h-12 rounded-xl px-6 has-[>svg]:px-4 min-w-[52px] text-base',
        icon: 'size-10 rounded-xl',
        'icon-sm': 'size-8 rounded-lg',
        'icon-lg': 'size-12 rounded-xl',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

const Button = React.forwardRef<HTMLButtonElement, React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        ref={ref as any}
        data-slot="button"
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      />
    )
  }
)

Button.displayName = 'Button'

export { Button, buttonVariants }
