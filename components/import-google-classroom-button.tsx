"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { GoogleIcon } from "@/components/icons"
import { GoogleClassroomOnboarding } from "@/components/google-classroom-onboarding"
import { ApiService } from "@/services/apiService"

interface ImportGoogleClassroomButtonProps {
  onImportComplete?: () => void
}

export function ImportGoogleClassroomButton({ onImportComplete }: ImportGoogleClassroomButtonProps) {
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleImportClick = async () => {
    setIsLoading(true)
    
    try {
      // 使用 manualSyncAll 來同步所有 Google 服務（包括 Classroom）
      // 這與「立即同步所有 Google 服務」使用相同的 API
      const response = await ApiService.manualSyncAll()
      
      if (response.error) {
        alert(`同步失敗：${response.error}`)
        return
      }
      
      // 等待資料寫入資料庫
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // 顯示課程選擇界面
      setShowOnboarding(true)
    } catch (error) {
      console.error('同步 Google Classroom 失敗:', error)
      alert('同步失敗，請稍後再試')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOnboardingComplete = () => {
    setShowOnboarding(false)
    // 匯入完成後刷新課程列表
    if (onImportComplete) {
      onImportComplete()
    }
  }

  const handleOnboardingSkip = () => {
    setShowOnboarding(false)
    // 用戶選擇稍後再說，不刷新課程列表
    // 這樣未設定時間表的課程不會顯示在列表中
  }

  return (
    <>
      <Button
        onClick={handleImportClick}
        disabled={isLoading}
        variant="outline"
        size="sm"
        className="gap-2"
      >
        <GoogleIcon className="w-4 h-4" />
        {isLoading ? '同步中...' : '匯入 Google Classroom 課程'}
      </Button>

      <GoogleClassroomOnboarding
        isOpen={showOnboarding}
        onComplete={handleOnboardingComplete}
        onSkip={handleOnboardingSkip}
      />
    </>
  )
}
