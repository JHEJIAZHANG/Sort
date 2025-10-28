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

  const handleImportClick = async () => {
    // 直接顯示課程選擇界面，API 調用在 GoogleClassroomOnboarding 組件內部處理
    setShowOnboarding(true)
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
        variant="outline"
        size="sm"
        className="gap-2"
      >
        <GoogleIcon className="w-4 h-4" />
        匯入 Google Classroom 課程
      </Button>

      <GoogleClassroomOnboarding
        isOpen={showOnboarding}
        onComplete={handleOnboardingComplete}
        onSkip={handleOnboardingSkip}
      />
    </>
  )
}
