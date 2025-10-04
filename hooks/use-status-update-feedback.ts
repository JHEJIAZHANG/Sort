"use client"

import { useState, useCallback } from "react"
import { useToast } from "@/hooks/use-toast"

export interface StatusUpdateState {
  isUpdating: boolean
  error: string | null
  lastUpdateId: string | null
}

export interface StatusUpdateOptions {
  showSuccessToast?: boolean
  showErrorToast?: boolean
  successMessage?: string
  errorMessage?: string
  enableRetry?: boolean
  retryAttempts?: number
}

export function useStatusUpdateFeedback() {
  const [updateStates, setUpdateStates] = useState<Record<string, StatusUpdateState>>({})
  const { showSuccess, showError } = useToast()

  const getUpdateState = useCallback((id: string): StatusUpdateState => {
    return updateStates[id] || { isUpdating: false, error: null, lastUpdateId: null }
  }, [updateStates])

  const setUpdateState = useCallback((id: string, state: Partial<StatusUpdateState>) => {
    setUpdateStates(prev => ({
      ...prev,
      [id]: { ...getUpdateState(id), ...state }
    }))
  }, [getUpdateState])

  const executeWithFeedback = useCallback(async <T>(
    id: string,
    operation: () => Promise<T>,
    options: StatusUpdateOptions = {}
  ): Promise<T> => {
    const {
      showSuccessToast = true,
      showErrorToast = true,
      successMessage = "狀態更新成功",
      errorMessage = "狀態更新失敗",
      enableRetry = true,
      retryAttempts = 2
    } = options

    // 防止重複操作：不拋錯，直接忽略此次操作
    if (getUpdateState(id).isUpdating) {
      // 靜默忽略，避免 Unhandled Runtime Error
      return Promise.resolve(undefined as T)
    }

    // 設置載入狀態
    setUpdateState(id, { 
      isUpdating: true, 
      error: null, 
      lastUpdateId: id 
    })

    let lastError: Error | null = null
    let attempt = 0

    while (attempt <= retryAttempts) {
      try {
        const result = await operation()
        
        // 成功：清除狀態並顯示成功訊息
        setUpdateState(id, { 
          isUpdating: false, 
          error: null, 
          lastUpdateId: null 
        })
        
        if (showSuccessToast) {
          showSuccess(successMessage)
        }
        
        return result
        
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))
        attempt++
        
        // 如果還有重試機會且啟用重試
        if (attempt <= retryAttempts && enableRetry) {
  
          // 遞增延遲重試
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
          continue
        }
        
        // 所有重試都失敗，設置錯誤狀態
        const finalError = `${errorMessage}: ${lastError.message}`
        setUpdateState(id, { 
          isUpdating: false, 
          error: finalError, 
          lastUpdateId: id 
        })
        
        if (showErrorToast) {
          showError(finalError)
        }
        
        throw lastError
      }
    }

    // 這裡不應該到達，但為了類型安全
    throw lastError || new Error("未知錯誤")
  }, [getUpdateState, setUpdateState, showSuccess, showError])

  const retry = useCallback(async (id: string, operation: () => Promise<any>) => {
    const state = getUpdateState(id)
    if (!state.error) {
      return
    }

    return executeWithFeedback(id, operation, {
      successMessage: "重試成功",
      errorMessage: "重試失敗",
      retryAttempts: 1 // 手動重試只嘗試一次
    })
  }, [getUpdateState, executeWithFeedback])

  const clearError = useCallback((id: string) => {
    setUpdateState(id, { error: null })
  }, [setUpdateState])

  const clearAllStates = useCallback(() => {
    setUpdateStates({})
  }, [])

  return {
    getUpdateState,
    executeWithFeedback,
    retry,
    clearError,
    clearAllStates
  }
}