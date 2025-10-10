"use client"

import { useState } from "react"

export interface NotificationSettings {
  assignmentReminderTiming: string // "15min" | "30min" | "1hour" | "2hours" | "1day" | "2days" | "1week"
  examReminderTiming: string
  customCategoryReminderTiming: string
  enablePushNotifications: boolean
  enableEmailNotifications: boolean
  enableSoundNotifications: boolean
  quietHoursStart: string // HH:MM format
  quietHoursEnd: string // HH:MM format
  enableQuietHours: boolean
}

const defaultSettings: NotificationSettings = {
  assignmentReminderTiming: "1week",
  examReminderTiming: "1week",
  customCategoryReminderTiming: "1week",
  enablePushNotifications: true,
  enableEmailNotifications: false,
  enableSoundNotifications: true,
  quietHoursStart: "22:00",
  quietHoursEnd: "08:00",
  enableQuietHours: false,
}

export function useNotificationSettings() {
  const [settings, setSettings] = useState<NotificationSettings>(defaultSettings)
  const isLoading = false

  const updateSettings = (updates: Partial<NotificationSettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }))
  }

  const resetSettings = () => {
    setSettings(defaultSettings)
  }

  const getReminderDays = (timing: string): number => {
    switch (timing) {
      case "15min":
      case "30min":
      case "1hour":
      case "2hours":
        return 0 // Same day
      case "1day":
        return 1
      case "2days":
        return 2
      case "1week":
        return 7
      default:
        return 1
    }
  }

  const isInQuietHours = (date: Date = new Date()): boolean => {
    if (!settings.enableQuietHours) return false

    const currentTime = date.toTimeString().slice(0, 5) // HH:MM format
    const { quietHoursStart, quietHoursEnd } = settings

    // Handle cases where quiet hours span midnight
    if (quietHoursStart > quietHoursEnd) {
      return currentTime >= quietHoursStart || currentTime <= quietHoursEnd
    } else {
      return currentTime >= quietHoursStart && currentTime <= quietHoursEnd
    }
  }

  return {
    settings,
    isLoading,
    updateSettings,
    resetSettings,
    getReminderDays,
    isInQuietHours,
  }
}
