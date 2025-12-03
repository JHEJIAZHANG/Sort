"use client"

import React from 'react'
import { Button } from '@/components/ui/button'
import { DocumentIcon } from '@/components/icons'
import { useOCR } from '@/contexts/ocr-context'
import { OCRService } from '@/services/ocrService'

interface OCRScanButtonProps {
  variant?: "default" | "outline" | "ghost"
  size?: "sm" | "default" | "lg"
  className?: string
  style?: React.CSSProperties
  children?: React.ReactNode
  showIcon?: boolean
}

import { useState } from 'react'
import { UpgradePrompt } from '@/components/upgrade-prompt'

export function OCRScanButton({
  variant = "default",
  size = "default",
  className = "",
  style,
  children,
  showIcon = true
}: OCRScanButtonProps) {
  const {
    isLoading,
    startOCRScan,
    showOCRPreview,
    setError,
    setLoading
  } = useOCR()

  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false)
  const [quotaDetails, setQuotaDetails] = useState<any>(null)

  const handleScanClick = () => {
    if (isLoading) return

    OCRService.triggerFilePicker(async (file) => {
      startOCRScan()

      const result = await OCRService.scanImage(file)

      if (result.success && result.data) {
        showOCRPreview(result.data)
      } else {
        // 檢查是否為配額用完
        if (result.status === 403 && (result.details || (result.error && result.error.includes('QUOTA_EXCEEDED')))) {
          setQuotaDetails(result.details)
          setShowUpgradePrompt(true)
          setLoading(false)
          return
        }

        setError(result.error || 'OCR掃描失敗')
        setLoading(false)
        // 只有非配額錯誤才顯示 alert
        if (result.status !== 403) {
          alert(result.error || 'OCR掃描失敗')
        }
      }
    })
  }

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={className}
        style={style}
        onClick={handleScanClick}
        disabled={isLoading}
      >
        {showIcon && (
          <DocumentIcon className={`${size === "sm" ? "w-3 h-3" : "w-4 h-4"} ${children ? "mr-2" : ""}`} />
        )}
        {isLoading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
            掃描中...
          </>
        ) : (
          children || "掃描課表"
        )}
      </Button>

      <UpgradePrompt
        open={showUpgradePrompt}
        onClose={() => setShowUpgradePrompt(false)}
        quotaDetails={quotaDetails}
      />
    </>
  )
}
