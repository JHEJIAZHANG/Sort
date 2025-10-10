import type React from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeftIcon } from "@/components/icons"

interface PageHeaderProps {
  title: string | React.ReactNode
  subtitle?: string
  action?: React.ReactNode
  onBack?: () => void
}

export function PageHeader({ title, subtitle, action, onBack }: PageHeaderProps) {
  return (
    <header className="mb-6 lg:mb-12 animate-slide-down">
      <div className="flex items-start justify-between gap-3 sm:gap-4 mobile-spacing">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          {onBack && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onBack} 
              className="p-2 flex-shrink-0 hover-scale rounded-xl transition-all duration-300"
            >
              <ArrowLeftIcon className="w-5 h-5" />
            </Button>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-foreground text-balance leading-tight animate-fade-in">
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm sm:text-base lg:text-lg text-muted-foreground mt-2 lg:mt-3 animate-slide-up">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {action && (
          <div className="flex-shrink-0 animate-fade-in" style={{ animationDelay: '200ms' }}>
            <div className="flex flex-row gap-2">
              {action}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
