"use client"

import { Button } from "@/components/ui/button"
import { CheckIcon, ExclamationIcon, ClockIcon } from "@/components/icons"
import type { StatusUpdateState } from "@/hooks/use-status-update-feedback"

interface StatusUpdateFeedbackProps {
  state: StatusUpdateState
  onRetry?: () => void
  onClearError?: () => void
  className?: string
}

export function StatusUpdateFeedback({ 
  state, 
  onRetry, 
  onClearError, 
  className = "" 
}: StatusUpdateFeedbackProps) {
  if (!state.isUpdating && !state.error) {
    return null
  }

  if (state.isUpdating) {
    return (
      <div className={`flex items-center gap-2 text-blue-600 ${className}`}>
        <ClockIcon className="w-4 h-4 animate-spin" />
        <span className="text-sm font-medium">更新中...</span>
      </div>
    )
  }

  if (state.error) {
    return (
      <div className={`flex items-center gap-2 text-red-600 ${className}`}>
        <ExclamationIcon className="w-4 h-4" />
        <div className="flex-1">
          <p className="text-sm font-medium">{state.error}</p>
        </div>
        <div className="flex gap-1">
          {onRetry && (
            <Button
              size="sm"
              variant="outline"
              onClick={onRetry}
              className="h-6 px-2 text-xs border-red-300 text-red-600 hover:bg-red-50"
            >
              重試
            </Button>
          )}
          {onClearError && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onClearError}
              className="h-6 px-2 text-xs text-red-600 hover:bg-red-50"
            >
              ×
            </Button>
          )}
        </div>
      </div>
    )
  }

  return null
}

interface InlineStatusFeedbackProps {
  state: StatusUpdateState
  onRetry?: () => void
  onClearError?: () => void
}

export function InlineStatusFeedback({ state, onRetry, onClearError }: InlineStatusFeedbackProps) {
  if (state.isUpdating) {
    return (
      <span className="inline-flex items-center gap-1 text-blue-600 text-xs">
        <ClockIcon className="w-3 h-3 animate-spin" />
        更新中
      </span>
    )
  }

  if (state.error) {
    return (
      <span className="inline-flex items-center gap-1 text-red-600 text-xs">
        <ExclamationIcon className="w-3 h-3" />
        更新失敗
        {onRetry && (
          <button
            onClick={onRetry}
            className="ml-1 underline hover:no-underline"
          >
            重試
          </button>
        )}
      </span>
    )
  }

  return null
}

interface StatusButtonProps {
  isUpdating: boolean
  error?: string | null
  children: React.ReactNode
  onClick: () => void
  onRetry?: () => void
  disabled?: boolean
  className?: string
  variant?: "default" | "outline" | "ghost"
  size?: "sm" | "default" | "lg"
}

export function StatusButton({ 
  isUpdating, 
  error, 
  children, 
  onClick, 
  onRetry,
  disabled = false,
  className = "",
  variant = "outline",
  size = "sm"
}: StatusButtonProps) {
  if (error && onRetry) {
    return (
      <div className="flex gap-1">
        <Button
          size={size}
          variant="outline"
          onClick={onRetry}
          className={`border-red-300 text-red-600 hover:bg-red-50 ${className}`}
        >
          <ExclamationIcon className="w-4 h-4 mr-1" />
          重試
        </Button>
      </div>
    )
  }

  return (
    <Button
      size={size}
      variant={variant}
      onClick={onClick}
      disabled={disabled || isUpdating}
      className={className}
    >
      {isUpdating ? (
        <>
          <ClockIcon className="w-4 h-4 mr-1 animate-spin" />
          更新中...
        </>
      ) : (
        children
      )}
    </Button>
  )
}