"use client"

import { useCallback } from "react"
import { useStatusUpdateFeedback } from "./use-status-update-feedback"
import type { Assignment } from "@/types/course"

interface UseAssignmentStatusUpdateProps {
  onStatusChange: (id: string, status: Assignment["status"]) => Promise<void>
}

export function useAssignmentStatusUpdate({ onStatusChange }: UseAssignmentStatusUpdateProps) {
  const { getUpdateState, executeWithFeedback, retry, clearError } = useStatusUpdateFeedback()

  const updateStatus = useCallback(async (
    assignmentId: string, 
    newStatus: Assignment["status"],
    assignmentTitle?: string
  ) => {
    const statusText = newStatus === "completed" ? "完成" : "未完成"
    const itemName = assignmentTitle ? `「${assignmentTitle}」` : "作業"
    
    return executeWithFeedback(
      assignmentId,
      () => onStatusChange(assignmentId, newStatus),
      {
        successMessage: `${itemName}已標記為${statusText}`,
        errorMessage: `標記${itemName}為${statusText}失敗`,
        enableRetry: true,
        retryAttempts: 2
      }
    )
  }, [onStatusChange, executeWithFeedback])

  const retryUpdate = useCallback(async (
    assignmentId: string, 
    newStatus: Assignment["status"]
  ) => {
    return retry(assignmentId, () => onStatusChange(assignmentId, newStatus))
  }, [retry, onStatusChange])

  return {
    updateStatus,
    retryUpdate,
    getUpdateState,
    clearError
  }
}