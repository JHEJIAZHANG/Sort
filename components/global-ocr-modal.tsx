"use client"

import React from 'react'
import { useOCR } from '@/contexts/ocr-context'
import { OCRPreviewModal } from './ocr-preview-modal'
import { OCRService } from '@/services/ocrService'

export function GlobalOCRModal() {
  const { 
    isLoading, 
    previewData, 
    isPreviewOpen, 
    setLoading, 
    hideOCRPreview,
    setError 
  } = useOCR()

  const handleOcrConfirm = async (selectedCourses: any[]) => {
    setLoading(true)
    
    try {
      const result = await OCRService.confirmCourses(selectedCourses)
      
      if (!result.success) {
        alert(`課程創建失敗: ${result.error}`)
        return
      }

      const responseData = result.data!
      
      // 顯示成功訊息
      let message = `成功創建 ${responseData.coursesCreated} 個課程，${responseData.schedulesCreated} 個課表時段`
      if (responseData.skippedCourses.length > 0) {
        message += `\n跳過 ${responseData.skippedCourses.length} 個課程：${responseData.skippedCourses.map(s => s.reason).join(', ')}`
      }
      alert(message)

      // 關閉模態框
      hideOCRPreview()
      
      // 觸發自定義事件來通知頁面刷新
      window.dispatchEvent(new CustomEvent('coursesUpdated'))
      
    } catch (error) {
      console.error("[OCR] 確認創建過程發生錯誤:", error)
      alert("課程創建過程發生錯誤，請稍後再試")
    } finally {
      setLoading(false)
    }
  }

  const handleOcrCancel = () => {
    hideOCRPreview()
  }

  return (
    <OCRPreviewModal
      isOpen={isPreviewOpen}
      onClose={handleOcrCancel}
      data={previewData}
      loading={isLoading}
      onConfirm={handleOcrConfirm}
    />
  )
}