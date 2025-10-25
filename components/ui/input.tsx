import * as React from 'react'

import { cn } from '@/lib/utils'

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground',
        'border-input-border bg-background/50 backdrop-blur-sm',
        'flex h-10 w-full min-w-0 rounded-xl border px-4 py-2 text-base shadow-md',
        'transition-all duration-300 ease-out outline-none',
        'file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium',
        'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
        'focus:border-primary focus:shadow-lg focus:shadow-primary/20 focus:scale-[1.02]',
        'hover:border-primary/50 hover:shadow-md',
        'invalid:border-destructive invalid:shadow-destructive/20',
        'md:text-sm mobile-spacing',
        className,
      )}
      {...props}
    />
  )
}

export { Input }
