import * as React from "react"

import { cn } from "@/lib/utils"

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-slot="card"
    className={cn(
      "rounded-2xl border border-border bg-card/95 backdrop-blur-md text-card-foreground shadow-lg transition-all duration-300 ease-out hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1 animate-fade-in mobile-card",
      className,
    )}
    {...props}
  />
))
Card.displayName = "Card"

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 px-4 sm:px-6 py-4 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6 animate-slide-down",
        className,
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-title" className={cn("leading-tight font-semibold text-lg sm:text-xl animate-fade-in", className)} {...props} />
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-description" className={cn("text-muted-foreground text-sm leading-relaxed animate-slide-up", className)} {...props} />
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn("col-start-2 row-span-2 row-start-1 self-start justify-self-end", className)}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-content" className={cn("px-4 sm:px-6 py-2 animate-fade-in", className)} {...props} />
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-footer" className={cn("flex items-center gap-3 px-4 sm:px-6 py-4 [.border-t]:pt-6 animate-slide-up", className)} {...props} />
}

export { Card, CardHeader, CardFooter, CardTitle, CardAction, CardDescription, CardContent }
