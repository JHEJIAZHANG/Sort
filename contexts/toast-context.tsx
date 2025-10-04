"use client"

import React, { createContext, useContext } from "react"
import { useToast } from "@/hooks/use-toast"
import { ToastContainer } from "@/components/toast"
import type { ToastMessage } from "@/hooks/use-toast"

interface ToastContextType {
  showSuccess: (message: string) => void
  showError: (message: string) => void
  showInfo: (message: string) => void
  toasts: ToastMessage[]
  removeToast: (id: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const { toasts, showSuccess, showError, showInfo, removeToast } = useToast()

  return (
    <ToastContext.Provider value={{ showSuccess, showError, showInfo, toasts, removeToast }}>
      {children}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </div>
    </ToastContext.Provider>
  )
}

export function useToastContext() {
  const context = useContext(ToastContext)
  if (context === undefined) {
    throw new Error("useToastContext must be used within a ToastProvider")
  }
  return context
}