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
    setShowOnboarding(false)
    if (onImportComplete) {
      onImportComplete()
    }
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
