"use client"

import React, { createContext, useContext, useState, ReactNode } from 'react'

// OCR 數據類型定義
interface OCRSchedule {
  day_of_week: number
  start: string
  end: string
}

interface OCRConflict {
  day_of_week: number
  start_time: string
  end_time: string
  conflicting_course: {
    id: number
    title: string
    instructor: string
    classroom: string
    start_time: string
    end_time: string
  }
}

interface OCRCourse {
  title: string
  instructor: string
  classroom: string
  schedule: OCRSchedule[]
  conflicts?: OCRConflict[]
  has_conflicts?: boolean
}

interface OCRPreviewData {
  items: OCRCourse[]
  total_courses: number
  courses_with_conflicts: number
}

interface OCRConfirmResponse {
  coursesCreated: number
  schedulesCreated: number
  skippedCourses: Array<{ reason: string }>
}

// OCR 上下文狀態
interface OCRContextState {
  isLoading: boolean
  previewData: OCRPreviewData | null
  isPreviewOpen: boolean
  error: string | null
}

// OCR 上下文動作
interface OCRContextActions {
  setLoading: (loading: boolean) => void
  setPreviewData: (data: OCRPreviewData | null) => void
  setPreviewOpen: (open: boolean) => void
  setError: (error: string | null) => void
  clearOCRState: () => void
  startOCRScan: () => void
  showOCRPreview: (data: OCRPreviewData) => void
  hideOCRPreview: () => void
}

type OCRContextType = OCRContextState & OCRContextActions

const OCRContext = createContext<OCRContextType | undefined>(undefined)

interface OCRProviderProps {
  children: ReactNode
}

export function OCRProvider({ children }: OCRProviderProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [previewData, setPreviewData] = useState<OCRPreviewData | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const setLoading = (loading: boolean) => {
    setIsLoading(loading)
    if (loading) {
      setError(null)
    }
  }

  const clearOCRState = () => {
    setIsLoading(false)
    setPreviewData(null)
    setIsPreviewOpen(false)
    setError(null)
  }

  const startOCRScan = () => {
    setLoading(true)
    setError(null)
  }

  const showOCRPreview = (data: OCRPreviewData) => {
    setPreviewData(data)
    setIsPreviewOpen(true)
    setLoading(false)
  }

  const hideOCRPreview = () => {
    setIsPreviewOpen(false)
    setPreviewData(null)
  }

  const contextValue: OCRContextType = {
    // State
    isLoading,
    previewData,
    isPreviewOpen,
    error,
    // Actions
    setLoading,
    setPreviewData,
    setPreviewOpen: setIsPreviewOpen,
    setError,
    clearOCRState,
    startOCRScan,
    showOCRPreview,
    hideOCRPreview,
  }

  return (
    <OCRContext.Provider value={contextValue}>
      {children}
    </OCRContext.Provider>
  )
}

export function useOCR() {
  const context = useContext(OCRContext)
  if (context === undefined) {
    throw new Error('useOCR must be used within an OCRProvider')
  }
  return context
}

// 導出類型供其他組件使用
export type { OCRSchedule, OCRConflict, OCRCourse, OCRPreviewData, OCRConfirmResponse }