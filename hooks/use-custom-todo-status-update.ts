"use client"

import { useCallback } from "react"
import { useStatusUpdateFeedback } from "./use-status-update-feedback"
import type { CustomTodoItem } from "./use-custom-todos"

interface UseCustomTodoStatusUpdateProps {
  onStatusChange: (id: string, status: CustomTodoItem["status"]) => Promise<void>
}

export function useCustomTodoStatusUpdate({ onStatusChange }: UseCustomTodoStatusUpdateProps) {
  const { getUpdateState, executeWithFeedback, retry, clearError } = useStatusUpdateFeedback()

  const updateStatus = useCallback(async (
    todoId: string, 
    newStatus: CustomTodoItem["status"],
    todoTitle?: string
  ) => {
    const statusText = newStatus === "completed" ? "完成" : "未完成"
    const itemName = todoTitle ? `「${todoTitle}」` : "待辦事項"
    
    return executeWithFeedback(
      todoId,
      () => onStatusChange(todoId, newStatus),
      {
        successMessage: `${itemName}已標記為${statusText}`,
        errorMessage: `標記${itemName}為${statusText}失敗`,
        enableRetry: true,
        retryAttempts: 2
      }
    )
  }, [onStatusChange, executeWithFeedback])

  const retryUpdate = useCallback(async (
    todoId: string, 
    newStatus: CustomTodoItem["status"]
  ) => {
    return retry(todoId, () => onStatusChange(todoId, newStatus))
  }, [retry, onStatusChange])

  return {
    updateStatus,
    retryUpdate,
    getUpdateState,
    clearError
  }
}