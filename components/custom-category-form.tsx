"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { Course } from "@/types/course"

export interface CustomCategoryItem {
  id: string
  courseId: string
  title: string
  description?: string
  dueDate: Date
  category: string
  status: "pending" | "completed" | "overdue"
  customReminderTiming?: "15min" | "30min" | "1hour" | "2hours" | "1day" | "2days" | "1week" | "default"
  createdAt: Date
  updatedAt: Date
}

interface CustomCategoryFormProps {
  courses: Course[]
  category: string
  onSubmit: (item: Omit<CustomCategoryItem, "id" | "createdAt" | "updatedAt">) => void
  onCancel: () => void
  initialData?: Partial<CustomCategoryItem>
}

const formatDateTimeLocal = (date: Date | string | undefined): string => {
  if (!date) return ""

  try {
    const dateObj = date instanceof Date ? date : new Date(date)
    if (isNaN(dateObj.getTime())) return ""

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

export function CustomCategoryForm({ courses, category, onSubmit, onCancel, initialData }: CustomCategoryFormProps) {
  const [formData, setFormData] = useState({
    courseId: initialData?.courseId || courses[0]?.id || "",
    title: initialData?.title || "",
    description: initialData?.description || "",
    dueDate: formatDateTimeLocal(initialData?.dueDate),
    status: initialData?.status || ("pending" as const),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim() || !formData.dueDate || !formData.courseId) return

    onSubmit({
      courseId: formData.courseId,
      title: formData.title.trim(),
      description: formData.description.trim() || undefined,
      dueDate: new Date(formData.dueDate),
      category,
      status: formData.status,
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
            {category}標題 *
          </Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
            placeholder={`輸入${category}標題`}
            required
          />
        </div>

        <div>
          <Label htmlFor="description" className="font-bold">
            {category}描述
          </Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
            placeholder={`輸入${category}詳細描述`}
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
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, status: e.target.value as "pending" | "completed" | "overdue" }))
            }
            className="w-full px-3 py-2 border border-border rounded-md bg-background"
          >
            <option value="pending">進行中</option>
            <option value="completed">已完成</option>
            <option value="overdue">已逾期</option>
          </select>
        </div>

        <div className="flex gap-2 pt-4">
          <Button type="submit" className="flex-1">
            {initialData ? `更新${category}` : `新增${category}`}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel} className="flex-1 bg-transparent">
            取消
          </Button>
        </div>
      </form>
    </Card>
  )
}
