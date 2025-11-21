"use client"

import { useState, useCallback } from "react"

export interface ToastMessage {
  id: string
  type: "success" | "error" | "info"
  message: string
  duration?: number
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const showToast = useCallback((message: string, type: ToastMessage["type"] = "info", duration = 3000) => {
    const id = Math.random().toString(36).substr(2, 9)
    const toast: ToastMessage = { id, message, type, duration }
    
    setToasts(prev => [...prev, toast])
    
    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id))
      }, duration)
    }
    
    return id
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const showSuccess = useCallback((message: string) => showToast(message, "success"), [showToast])
  const showError = useCallback((message: string) => showToast(message, "error"), [showToast])
  const showInfo = useCallback((message: string) => showToast(message, "info"), [showToast])

  return {
    toasts,
    showToast,
    showSuccess,
    showError,
    showInfo,
    removeToast
  }
}