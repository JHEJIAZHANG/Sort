"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BookOpen, Users, Clock, MapPin, Plus, X, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { Course } from "@/types/course"
import { ApiService } from "@/services/apiService"

interface GoogleClassroomImportProps {
  isOpen: boolean
  onClose: () => void
  onImport: (course: Omit<Course, "id" | "createdAt">) => void
}

interface TimeSlot {
  dayOfWeek: number
  startTime: string
  endTime: string
}

export function GoogleClassroomImport({ isOpen, onClose, onImport }: GoogleClassroomImportProps) {
  const [courseCode, setCourseCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [previewCourse, setPreviewCourse] = useState<Omit<Course, "id" | "createdAt" | "schedule"> | null>(null)
  const [customSchedule, setCustomSchedule] = useState<TimeSlot[]>([])
  const [step, setStep] = useState<"input" | "schedule" | "preview">("input")
  const [error, setError] = useState<string | null>(null)

  const dayNames = ["週一", "週二", "週三", "週四", "週五", "週六", "週日"]

  const handleFetchCourse = async () => {
    if (!courseCode.trim()) return

    setIsLoading(true)
    setError(null)

    try {
      // 使用真實的 API 調用
      const courseData = await ApiService.syncGoogleClassroomCourse(courseCode.trim())
      
      if (courseData) {
        const course: Omit<Course, "id" | "createdAt" | "schedule"> = {
          name: (courseData as any).name || "未知課程",
          courseCode: (courseData as any).courseCode || courseCode.trim(),
          instructor: (courseData as any).instructor || "未知教師",
          classroom: (courseData as any).classroom || "未指定教室",
          studentCount: (courseData as any).studentCount || 0,
          color: (courseData as any).color || "#3b82f6",
        }

        setPreviewCourse(course)
        setStep("schedule")
      } else {
        setError("無法獲取課程資訊，請檢查課程代碼是否正確")
      }
    } catch (err) {
      console.error("Failed to fetch course:", err)
      setError("獲取課程失敗，請檢查 Google Classroom 連接狀態")
    } finally {
      setIsLoading(false)
    }
  }

  const addTimeSlot = () => {
    setCustomSchedule([...customSchedule, { dayOfWeek: 0, startTime: "09:00", endTime: "12:00" }])
  }

  const removeTimeSlot = (index: number) => {
    setCustomSchedule(customSchedule.filter((_, i) => i !== index))
  }

  const updateTimeSlot = (index: number, field: keyof TimeSlot, value: string | number) => {
    const updated = [...customSchedule]
    updated[index] = { ...updated[index], [field]: value }
    setCustomSchedule(updated)
  }

  const handleScheduleNext = () => {
    if (customSchedule.length === 0) return
    setStep("preview")
  }

  const handleImport = () => {
    if (previewCourse && customSchedule.length > 0) {
      const finalCourse = {
        ...previewCourse,
        schedule: customSchedule,
      }
      onImport(finalCourse)
      handleCancel()
    }
  }

  const handleCancel = () => {
    setCourseCode("")
    setPreviewCourse(null)
    setCustomSchedule([])
    setError(null)
    setStep("input")
    onClose()
  }

  const handleBack = () => {
    if (step === "schedule") {
      setStep("input")
    } else if (step === "preview") {
      setStep("schedule")
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="max-w-[calc(100vw-1rem)] sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            匯入 Google Classroom 課程
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {step === "input" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="courseCode" className="font-medium">
                  課程代碼
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="courseCode"
                    value={courseCode}
                    onChange={(e) => setCourseCode(e.target.value)}
                    placeholder="輸入 Google Classroom 課程代碼 (例如: CS101)"
                    className="flex-1"
                  />
                  <Button onClick={handleFetchCourse} disabled={!courseCode.trim() || isLoading}>
                    {isLoading ? "獲取中..." : "獲取課程"}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">請輸入您在 Google Classroom 中的課程代碼</p>
                
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
              </div>
            </>
          )}

          {step === "schedule" && previewCourse && (
            <>
              <div className="space-y-4">
                <Label className="font-medium">課程資訊</Label>
                <Card className="p-4 border-2 border-blue-200 bg-blue-50">
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg">{previewCourse.name}</h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <span>代碼: {previewCourse.courseCode}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {previewCourse.studentCount} 位學生
                      </div>
                      <div className="flex items-center gap-1">
                        <span>{previewCourse.instructor}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {previewCourse.classroom}
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="font-medium">設定上課時間 *</Label>
                  <Button onClick={addTimeSlot} size="sm" variant="outline">
                    <Plus className="w-4 h-4 mr-1" />
                    新增時段
                  </Button>
                </div>

                {customSchedule.length === 0 && (
                  <Card className="p-4 text-center text-muted-foreground">
                    <p>請至少新增一個上課時段</p>
                  </Card>
                )}

                {customSchedule.map((slot, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex items-center gap-3">
                      <Select
                        value={slot.dayOfWeek.toString()}
                        onValueChange={(value) => updateTimeSlot(index, "dayOfWeek", Number.parseInt(value))}
                      >
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {dayNames.map((day, dayIndex) => (
                            <SelectItem key={dayIndex} value={dayIndex.toString()}>
                              {day}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Input
                        type="time"
                        value={slot.startTime}
                        onChange={(e) => updateTimeSlot(index, "startTime", e.target.value)}
                        className="w-32"
                      />

                      <span className="text-muted-foreground">至</span>

                      <Input
                        type="time"
                        value={slot.endTime}
                        onChange={(e) => updateTimeSlot(index, "endTime", e.target.value)}
                        className="w-32"
                      />

                      <Button
                        onClick={() => removeTimeSlot(index)}
                        size="sm"
                        variant="ghost"
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={handleBack} variant="outline" className="flex-1 bg-transparent">
                  返回
                </Button>
                <Button onClick={handleScheduleNext} disabled={customSchedule.length === 0} className="flex-1">
                  下一步
                </Button>
              </div>
            </>
          )}

          {step === "preview" && previewCourse && (
            <>
              <div className="space-y-4">
                <Label className="font-medium">課程預覽</Label>
                <Card className="p-4 border-2 border-green-200 bg-green-50">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-lg">{previewCourse.name}</h3>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <span>代碼: {previewCourse.courseCode}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {previewCourse.studentCount} 位學生
                          </div>
                          <div className="flex items-center gap-1">
                            <span>{previewCourse.instructor}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {previewCourse.classroom}
                          </div>
                        </div>
                      </div>
                      <div className="w-4 h-4 rounded-full border" style={{ backgroundColor: previewCourse.color }} />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-sm">
                        <Clock className="w-4 h-4" />
                        <span className="font-medium">上課時間：</span>
                      </div>
                      {customSchedule.map((slot, slotIndex) => (
                        <div key={slotIndex} className="text-sm text-muted-foreground ml-5">
                          {dayNames[slot.dayOfWeek]} {slot.startTime} - {slot.endTime}
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={handleBack} variant="outline" className="flex-1 bg-transparent">
                  返回
                </Button>
                <Button onClick={handleImport} className="flex-1">
                  匯入課程
                </Button>
              </div>
            </>
          )}

          {step === "input" && (
            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={handleCancel} className="flex-1 bg-transparent">
                取消
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
