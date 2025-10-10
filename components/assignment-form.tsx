"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { Assignment, Course } from "@/types/course"

interface AssignmentFormProps {
  courses: Course[]
  onSubmit: (assignment: Omit<Assignment, "id">) => void
  onCancel: () => void
  initialData?: Partial<Assignment>
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

export function AssignmentForm({ courses, onSubmit, onCancel, initialData }: AssignmentFormProps) {
  const [formData, setFormData] = useState({
    courseId: initialData?.courseId || courses[0]?.id || "",
    title: initialData?.title || "",
    description: initialData?.description || "",
    dueDate: formatDateTimeLocal(initialData?.dueDate),
    status: initialData?.status || ("pending" as Assignment["status"]),
    googleClassroomUrl: initialData?.googleClassroomUrl || "",
    source: initialData?.source || ("manual" as Assignment["source"]),
    customReminderTiming: (initialData?.customReminderTiming || "default") as Assignment["customReminderTiming"],
  })

  // 計算提醒時間
  const calculateNotificationTime = (dueDate: Date, reminderTiming: string): Date => {
    const notificationTime = new Date(dueDate)
    
    switch (reminderTiming) {
      case "15min":
        notificationTime.setMinutes(notificationTime.getMinutes() - 15)
        break
      case "30min":
        notificationTime.setMinutes(notificationTime.getMinutes() - 30)
        break
      case "1hour":
        notificationTime.setHours(notificationTime.getHours() - 1)
        break
      case "2hours":
        notificationTime.setHours(notificationTime.getHours() - 2)
        break
      case "1day":
        notificationTime.setDate(notificationTime.getDate() - 1)
        break
      case "2days":
        notificationTime.setDate(notificationTime.getDate() - 2)
        break
      case "1week":
        notificationTime.setDate(notificationTime.getDate() - 7)
        break
      default:
        // 預設為截止日期前 1 天
        notificationTime.setDate(notificationTime.getDate() - 1)
        break
    }
    
    return notificationTime
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim() || !formData.dueDate || !formData.courseId) return

    const dueDate = new Date(formData.dueDate)
    const reminderTiming = formData.customReminderTiming || "default"
    const notificationTime = calculateNotificationTime(dueDate, reminderTiming)

    onSubmit({
      courseId: formData.courseId,
      title: formData.title.trim(),
      description: formData.description.trim() || undefined,
      dueDate: dueDate,
      status: formData.status,
      googleClassroomUrl: formData.googleClassroomUrl.trim() || undefined,
      source: formData.source,
      customReminderTiming: formData.customReminderTiming as Assignment["customReminderTiming"],
      notificationTime: notificationTime,
    })
  }

  return (
    <Card className="p-4 sm:p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="courseId" className="font-bold">
            選擇課程 *
          </Label>
          <select
            id="courseId"
            value={formData.courseId}
            onChange={(e) => setFormData((prev) => ({ ...prev, courseId: e.target.value }))}
            className="w-full px-3 py-2 border border-border rounded-md bg-background"
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
          <Label htmlFor="title" className="font-bold">
            作業標題 *
          </Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
            placeholder="輸入作業標題"
            required
          />
        </div>

        <div>
          <Label htmlFor="description" className="font-bold">
            作業描述
          </Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
            placeholder="輸入作業詳細描述"
            rows={3}
          />
        </div>

        <div>
          <Label htmlFor="dueDate" className="font-bold">
            截止日期 *
          </Label>
          <input
            id="dueDate"
            type="datetime-local"
            value={formData.dueDate}
            onChange={(e) => setFormData((prev) => ({ ...prev, dueDate: e.target.value }))}
            required
            className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <Label htmlFor="status" className="font-bold">
            狀態
          </Label>
          <select
            id="status"
            value={formData.status}
            onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value as Assignment["status"] }))}
            className="w-full px-3 py-2 border border-border rounded-md bg-background"
          >
            <option value="pending">進行中</option>
            <option value="completed">已完成</option>
            <option value="overdue">已逾期</option>
          </select>
        </div>

        <div>
          <Label htmlFor="customReminderTiming" className="font-bold">
            提醒時間
          </Label>
          <select
            id="customReminderTiming"
            value={formData.customReminderTiming}
            onChange={(e) => setFormData((prev) => ({ ...prev, customReminderTiming: e.target.value as Assignment["customReminderTiming"] }))}
            className="w-full px-3 py-2 border border-border rounded-md bg-background"
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

        <div className="border-t pt-4">
          <h3 className="font-bold text-sm mb-3">Google Classroom 整合</h3>

          <div>
            <Label htmlFor="source" className="font-bold">
              來源
            </Label>
            <select
              id="source"
              value={formData.source}
              onChange={(e) => setFormData((prev) => ({ ...prev, source: e.target.value as Assignment["source"] }))}
              className="w-full px-3 py-2 border border-border rounded-md bg-background"
            >
              <option value="manual">手動建立</option>
              <option value="google_classroom">Google Classroom</option>
            </select>
          </div>

          {formData.source === "google_classroom" && (
            <div className="mt-3">
              <Label htmlFor="googleClassroomUrl" className="font-bold">
                Google Classroom 連結
              </Label>
              <Input
                id="googleClassroomUrl"
                value={formData.googleClassroomUrl}
                onChange={(e) => setFormData((prev) => ({ ...prev, googleClassroomUrl: e.target.value }))}
                placeholder="https://classroom.google.com/..."
                type="url"
              />
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-4">
          <Button type="submit" className="flex-1">
            {initialData ? "更新作業" : "新增作業"}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel} className="flex-1 bg-transparent">
            取消
          </Button>
        </div>
      </form>
    </Card>
  )
}
