"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Camera, Upload } from "lucide-react"
import type { Course } from "@/types/course"
import { ApiService } from "@/services/apiService"
import { OCRPreviewModal } from "@/components/ocr-preview-modal"

// OCR 數據類型定義
interface OCRSchedule {
  day_of_week: number
  start: string
  end: string
}

interface OCRConflict {
  day_of_week: number
  start_time: string
  end_time: string
  conflicting_course: {
    id: number
    title: string
    instructor: string
    classroom: string
    start_time: string
    end_time: string
  }
}

interface OCRCourse {
  title: string
  instructor: string
  classroom: string
  schedule: OCRSchedule[]
  conflicts?: OCRConflict[]
  has_conflicts?: boolean
}

interface OCRPreviewData {
  items: OCRCourse[]
  total_courses: number
  courses_with_conflicts: number
}

interface OCRConfirmResponse {
  coursesCreated: number
  schedulesCreated: number
  skippedCourses: Array<{ reason: string }>
}

interface CourseFormProps {
  onSubmit: (course: Omit<Course, "id" | "createdAt">) => Promise<void> | void
  onCancel: () => void
  onBulkImport?: (courses: Omit<Course, "id" | "createdAt">[]) => void
  initialCourse?: Course
  existingCourses?: Course[] // 用於檢查衝突
}

const PRIMARY_COLOR = "#ff9100"

const DAYS = [
  { value: 0, label: "週一" },
  { value: 1, label: "週二" },
  { value: 2, label: "週三" },
  { value: 3, label: "週四" },
  { value: 4, label: "週五" },
  { value: 5, label: "週六" },
  { value: 6, label: "週日" },
]

export function CourseForm({ onSubmit, onCancel, onBulkImport, initialCourse, existingCourses = [] }: CourseFormProps) {
  const isEditMode = Boolean(initialCourse)
  const [formData, setFormData] = useState({
    name: initialCourse?.name || "",
    courseCode: initialCourse?.courseCode || "", // 添加課程代碼欄位
    instructor: initialCourse?.instructor || "",
    classroom: initialCourse?.classroom || "",
    color: PRIMARY_COLOR,
    schedule: initialCourse?.schedule || [{ dayOfWeek: 0, startTime: "08:00", endTime: "10:00" }],
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // OCR 預覽相關狀態
  const [ocrPreviewOpen, setOcrPreviewOpen] = useState(false)
  const [ocrPreviewData, setOcrPreviewData] = useState<OCRPreviewData | null>(null)
  const [ocrLoading, setOcrLoading] = useState(false)

  const handleImageScan = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setOcrLoading(true)
    try {
      console.log("[OCR] 開始掃描圖片:", file.name)

      // 調用預覽模式 OCR API
      const response = await ApiService.previewTimetableImage(file)

      if (response.error) {
        console.error("[OCR] 掃描失敗:", response.error)
        alert(`OCR掃描失敗: ${response.error}`)
        return
      }

      // 檢查是否有課程數據
      if ((response.data as any)?.items && (response.data as any).items.length > 0) {
        console.log("[OCR] 成功識別課程:", (response.data as any).total_courses, "個")
        setOcrPreviewData(response.data as OCRPreviewData)
        setOcrPreviewOpen(true)
      } else {
        console.warn("[OCR] 未識別到課程數據")
        alert("未能從圖片中識別到課程信息，請確認圖片清晰度或嘗試其他圖片")
      }
    } catch (error) {
      console.error("[OCR] 掃描過程發生錯誤:", error)
      alert("OCR掃描過程發生錯誤，請稍後再試")
    } finally {
      setOcrLoading(false)
      // 清空文件輸入
      event.target.value = ''
    }
  }

  const handleOcrConfirm = async (selectedCourses: OCRCourse[]) => {
    setOcrLoading(true)
    try {
      console.log("[OCR] 確認創建課程:", selectedCourses.length, "個")

      const response = await ApiService.confirmTimetableImport(selectedCourses)

      if (response.error) {
        console.error("[OCR] 創建失敗:", response.error)
        alert(`課程創建失敗: ${response.error}`)
        return
      }

      const responseData = response.data as OCRConfirmResponse
      const coursesCreated = responseData?.coursesCreated || 0
      const schedulesCreated = responseData?.schedulesCreated || 0
      const skippedCourses = responseData?.skippedCourses || []

      if (coursesCreated > 0) {
        let message = `成功創建 ${coursesCreated} 個課程，${schedulesCreated} 個時段！`
        if (skippedCourses.length > 0) {
          message += `\n跳過 ${skippedCourses.length} 個課程（${skippedCourses.map(c => c.reason).join(', ')}）`
        }
        alert(message)

        // 關閉模態框
        setOcrPreviewOpen(false)
        setOcrPreviewData(null)

        // 觸發父組件刷新課程列表
        if (onBulkImport) {
          // 如果有批量導入回調，調用它來刷新數據
          onBulkImport([])
        } else {
          // 如果沒有回調，則刷新頁面作為後備方案
          window.location.reload()
        }
      } else {
        alert("沒有課程被創建，可能都存在時段衝突")
        setOcrPreviewOpen(false)
        setOcrPreviewData(null)
      }
    } catch (error) {
      console.error("[OCR] 確認創建過程發生錯誤:", error)
      alert("課程創建過程發生錯誤，請稍後再試")
    } finally {
      setOcrLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim() || isSubmitting) return

    // 檢查課程時段衝突：同一星期日，時間區間重疊則視為衝突
    const conflicts: { with: string; day: number; start: string; end: string }[] = []
    for (const slot of formData.schedule) {
      const newStart = slot.startTime
      const newEnd = slot.endTime
      if (!newStart || !newEnd || newStart >= newEnd) {
        alert('請確認上課時間區間有效（開始時間需早於結束時間）')
        return
      }
      existingCourses.forEach((c) => {
        // 編輯時忽略自身
        if (initialCourse && c.id === initialCourse.id) return
        c.schedule.forEach((s) => {
          if (s.dayOfWeek === slot.dayOfWeek) {
            const overlap = !(newEnd <= s.startTime || newStart >= s.endTime)
            if (overlap) {
              conflicts.push({ with: c.name, day: slot.dayOfWeek, start: s.startTime, end: s.endTime })
            }
          }
        })
      })
    }
    if (conflicts.length > 0) {
      const dayLabel = (d: number) => {
        const dayMap: { [key: number]: string } = {
          0: '週一',
          1: '週二',
          2: '週三',
          3: '週四',
          4: '週五',
          5: '週六',
          6: '週日'
        }
        return dayMap[d] || '未知'
      }
      const msg = conflicts
        .map((c) => `與「${c.with}」在 ${dayLabel(c.day)} ${c.start}~${c.end} 衝突`)
        .join('\n')
      alert(`時段衝突，無法新增/更新：\n${msg}`)
      return
    }

    try {
      setIsSubmitting(true)
      await onSubmit({
        name: formData.name.trim(),
        courseCode: formData.courseCode.trim() || undefined, // 包含課程代碼在提交數據中
        instructor: formData.instructor.trim() || undefined,
        classroom: formData.classroom.trim() || undefined,
        color: formData.color,
        schedule: formData.schedule,
      })
    } catch (error) {
      console.error('提交課程表單失敗:', error)
      alert('操作失敗，請稍後再試')
    } finally {
      setIsSubmitting(false)
    }
  }

  const addScheduleSlot = () => {
    setFormData((prev) => ({
      ...prev,
      schedule: [...prev.schedule, { dayOfWeek: 0, startTime: "08:00", endTime: "10:00" }],
    }))
  }

  const updateScheduleSlot = (index: number, field: string, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      schedule: prev.schedule.map((slot, i) => (i === index ? { ...slot, [field]: value } : slot)),
    }))
  }

  const removeScheduleSlot = (index: number) => {
    if (formData.schedule.length > 1) {
      setFormData((prev) => ({
        ...prev,
        schedule: prev.schedule.filter((_, i) => i !== index),
      }))
    }
  }

  const getTimeConstraints = (timeValue: string, isStartTime: boolean) => {
    // 設定合理的上課時間範圍：早上 7:00 到晚上 22:00
    return { min: "07:00", max: "22:00" }
  }

  return (
    <div className="space-y-6">
      {!initialCourse && (
        <Card className="p-6 bg-blue-50 border-blue-200">
          <div className="flex items-center gap-2 mb-4">
            <Upload className="w-5 h-5 text-blue-600" />
            <Label className="font-bold text-lg text-blue-800">批量匯入課程</Label>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageScan}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={ocrLoading}
              />
              <Button
                type="button"
                variant="outline"
                className="w-full bg-white hover:bg-blue-50 border-blue-300"
                disabled={ocrLoading}
              >
                {ocrLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                    掃描中...
                  </>
                ) : (
                  <>
                    <Camera className="w-4 h-4 mr-2" />
                    圖片掃描
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>
      )}

      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Label className="font-bold text-lg">{initialCourse ? "編輯課程" : "手動新增課程"}</Label>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          <div>
            <Label htmlFor="name" className="font-bold">
              課程名稱 *
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="輸入課程名稱"
              required
            />
          </div>

          <div>
            <Label htmlFor="courseCode" className="font-bold">
              課程代碼
            </Label>
            <Input
              id="courseCode"
              value={formData.courseCode}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, courseCode: e.target.value }))
              }
              placeholder="輸入課程代碼 (例如: CS101)"
            />
          </div>

          <div>
            <Label htmlFor="instructor" className="font-bold">
              授課教師
            </Label>
            <Input
              id="instructor"
              value={formData.instructor}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, instructor: e.target.value }))
              }
              placeholder="輸入教師姓名"
            />
          </div>

          <div>
            <Label htmlFor="classroom" className="font-bold">
              教室
            </Label>
            <Input
              id="classroom"
              value={formData.classroom}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, classroom: e.target.value }))
              }
              placeholder="輸入教室位置"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="font-bold">上課時間</Label>
              <Button type="button" variant="outline" size="sm" onClick={addScheduleSlot}>
                新增時段
              </Button>
            </div>

            {formData.schedule.map((slot, index) => (
              <div key={index} className="flex items-center gap-2 mb-2">
                <select
                  value={slot.dayOfWeek}
                  onChange={(e) => updateScheduleSlot(index, "dayOfWeek", Number.parseInt(e.target.value))}
                  className="px-3 py-2 border border-border rounded-md bg-background"
                >
                  {DAYS.map((day) => (
                    <option key={day.value} value={day.value}>
                      {day.label}
                    </option>
                  ))}
                </select>

                <Input
                  type="time"
                  value={slot.startTime}
                  onChange={(e) => updateScheduleSlot(index, "startTime", e.target.value)}
                  className="flex-1"
                  {...getTimeConstraints(slot.startTime, true)}
                />

                <span className="text-muted-foreground">至</span>

                <Input
                  type="time"
                  value={slot.endTime}
                  onChange={(e) => updateScheduleSlot(index, "endTime", e.target.value)}
                  className="flex-1"
                  {...getTimeConstraints(slot.endTime, false)}
                />

                {formData.schedule.length > 1 && (
                  <Button type="button" variant="outline" size="sm" onClick={() => removeScheduleSlot(index)}>
                    刪除
                  </Button>
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? "處理中..." : (initialCourse ? "更新課程" : "新增課程")}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel} className="flex-1 bg-transparent">
              取消
            </Button>
          </div>
        </form>
      </Card>

      {/* OCR 預覽模態框 */}
      <OCRPreviewModal
        isOpen={ocrPreviewOpen}
        onClose={() => {
          setOcrPreviewOpen(false)
          setOcrPreviewData(null)
        }}
        data={ocrPreviewData}
        onConfirm={handleOcrConfirm}
        loading={ocrLoading}
      />
    </div>
  )
}
