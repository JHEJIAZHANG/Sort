"use client"

import type React from "react"

import { useState } from "react"
import { calculateNotificationTime } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import type { Course, Exam } from "@/types/course"
import { useNotificationSettings } from "@/hooks/use-notification-settings"

interface ExamFormProps {
  courses: Course[]
  initialData?: Exam
  onSubmit: (examData: Omit<Exam, "id" | "createdAt" | "updatedAt">) => void
  onCancel: () => void
}

const formatDateTimeLocal = (date: Date | string | undefined): string => {
  if (!date) return ""

  try {
    const dateObj = date instanceof Date ? date : new Date(date)
    if (isNaN(dateObj.getTime())) return ""

    // Get local time components to avoid timezone shifts
    const year = dateObj.getFullYear()
    const month = String(dateObj.getMonth() + 1).padStart(2, "0")
    const day = String(dateObj.getDate()).padStart(2, "0")
    const hours = String(dateObj.getHours()).padStart(2, "0")
    const minutes = String(dateObj.getMinutes()).padStart(2, "0")

    return `${year}-${month}-${day}T${hours}:${minutes}`
  } catch (error) {
    console.error("[v0] Error formatting datetime-local:", error)
    return ""
  }
}

export function ExamForm({ courses, initialData, onSubmit, onCancel }: ExamFormProps) {
  const { settings: notificationSettings } = useNotificationSettings()
  
  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    courseId: initialData?.courseId || "",
    examDate: formatDateTimeLocal(initialData?.examDate),
    duration: initialData?.duration || 60,
    location: initialData?.location || "",
    description: initialData?.description || "",
    type: initialData?.type || ("midterm" as const),
    customReminderTiming: (initialData?.customReminderTiming || "default") as Exam["customReminderTiming"],
  })

  // 計算提醒時間改用共用工具

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title || !formData.courseId || !formData.examDate) return

    const examDate = new Date(formData.examDate)
    // 當選擇「使用統一設定」時，使用用戶的 examReminderTiming 設定
    const reminderTiming = formData.customReminderTiming === "default" 
      ? notificationSettings.examReminderTiming 
      : formData.customReminderTiming || "1week"
    const notificationTime = calculateNotificationTime(examDate, reminderTiming)

    onSubmit({
      title: formData.title,
      courseId: formData.courseId,
      examDate: examDate,
      duration: formData.duration,
      location: formData.location,
      description: formData.description,
      type: formData.type,
      status: "pending" as const,
      customReminderTiming: formData.customReminderTiming as Exam["customReminderTiming"],
      notificationTime: notificationTime,
    })
  }

  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (value === "") {
      setFormData({ ...formData, duration: 0 })
    } else {
      const numValue = Number.parseInt(value)
      if (!isNaN(numValue) && numValue >= 0) {
        setFormData({ ...formData, duration: Math.min(300, numValue) })
      }
    }
  }

  return (
    <Card className="bg-white p-4 sm:p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-bold text-foreground mb-2">考試名稱</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="輸入考試名稱"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-foreground mb-2">選擇課程</label>
          <select
            value={formData.courseId}
            onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
            className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            required
          >
            <option value="">請選擇課程</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-bold text-foreground mb-2">考試類型</label>
          <select
            value={formData.type}
            onChange={(e) =>
              setFormData({ ...formData, type: e.target.value as "midterm" | "final" | "quiz" | "other" })
            }
            className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="midterm">期中考</option>
            <option value="final">期末考</option>
            <option value="quiz">小考</option>
            <option value="other">其他</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-bold text-foreground mb-2">考試時間</label>
          <input
            type="datetime-local"
            value={formData.examDate}
            onChange={(e) => setFormData({ ...formData, examDate: e.target.value })}
            className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-foreground mb-2">考試時長（分鐘）</label>
          <input
            type="number"
            value={formData.duration || ""}
            onChange={handleDurationChange}
            className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            min="15"
            max="300"
            placeholder="輸入考試時長"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-foreground mb-2">考試地點</label>
          <input
            type="text"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="輸入考試地點"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-foreground mb-2">提醒時間</label>
          <select
            value={formData.customReminderTiming}
            onChange={(e) => setFormData({ ...formData, customReminderTiming: e.target.value as Exam["customReminderTiming"] })}
            className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="default">使用統一設定</option>
            <option value="15min">15分鐘前</option>
            <option value="30min">30分鐘前</option>
            <option value="1hour">1小時前</option>
            <option value="2hours">2小時前</option>
            <option value="1day">1天前</option>
            <option value="2days">2天前</option>
            <option value="1week">1週前</option>
          </select>
          <p className="text-sm text-muted-foreground mt-1">
            選擇「使用統一設定」將使用您在個人設定中的預設提醒時間
          </p>
        </div>

        <div>
          <label className="block text-sm font-bold text-foreground mb-2">備註</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            rows={3}
            placeholder="考試相關備註..."
          />
        </div>

        <div className="flex gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onCancel} className="flex-1 bg-transparent">
            取消
          </Button>
          <Button type="submit" className="flex-1">
            {initialData ? "更新考試" : "新增考試"}
          </Button>
        </div>
      </form>
    </Card>
  )
}
