"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { GoogleIcon } from "@/components/icons"
import { TeacherGoogleClassroomOnboarding } from "@/components/teacher-google-classroom-onboarding"

interface ImportTeacherGoogleClassroomButtonProps {
  onImportComplete?: () => void
}

export function ImportTeacherGoogleClassroomButton({ onImportComplete }: ImportTeacherGoogleClassroomButtonProps) {
  const [showOnboarding, setShowOnboarding] = useState(false)

  const handleImportClick = async () => {
    setShowOnboarding(true)
  }

  const handleOnboardingComplete = () => {
    console.log('========== 教師匯入按鈕：匯入完成 ==========')
    console.log('關閉匯入對話框')
    setShowOnboarding(false)
    
    console.log('呼叫 onImportComplete 回調函數')
    if (onImportComplete) {
      onImportComplete()
      console.log('✅ onImportComplete 已執行')
    } else {
      console.warn('⚠️ onImportComplete 未定義')
    }
    console.log('========================================')
  }

  const handleOnboardingSkip = () => {
    setShowOnboarding(false)
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

      <TeacherGoogleClassroomOnboarding
        isOpen={showOnboarding}
        onComplete={handleOnboardingComplete}
        onSkip={handleOnboardingSkip}
      />
    </>
  )
}
