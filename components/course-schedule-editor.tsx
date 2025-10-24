"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Clock, Plus, Trash2, Save } from "lucide-react"
import type { Course } from "@/types/course"
import { ApiService } from "@/services/apiService"

interface CourseScheduleEditorProps {
  course: Course
  onScheduleUpdate?: (courseId: string, schedules: Array<{ dayOfWeek: number; startTime: string; endTime: string; location?: string }>) => void
  trigger?: React.ReactNode
}

interface ScheduleSlot {
  dayOfWeek: number
  startTime: string
  endTime: string
  location?: string
}

const DAYS = [
  { value: 0, label: "週一" },
  { value: 1, label: "週二" },
  { value: 2, label: "週三" },
  { value: 3, label: "週四" },
  { value: 4, label: "週五" },
  { value: 5, label: "週六" },
  { value: 6, label: "週日" },
]

export function CourseScheduleEditor({ course, onScheduleUpdate, trigger }: CourseScheduleEditorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [schedules, setSchedules] = useState<ScheduleSlot[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // 初始化時間表數據
  useEffect(() => {
    if (isOpen) {
      if (course.schedule && course.schedule.length > 0) {
        // 如果課程已有時間表，使用現有數據
        setSchedules(course.schedule.map(slot => ({
          dayOfWeek: slot.dayOfWeek,
          startTime: slot.startTime,
          endTime: slot.endTime,
          location: slot.location || ""
        })))
      } else {
        // 如果沒有時間表，創建一個預設時段
        setSchedules([{
          dayOfWeek: 1, // 預設週二
          startTime: "09:00",
          endTime: "10:30",
          location: ""
        }])
      }
    }
  }, [isOpen, course])

  const addScheduleSlot = () => {
    setSchedules(prev => [...prev, {
      dayOfWeek: 1,
      startTime: "09:00",
      endTime: "10:30",
      location: ""
    }])
  }

  const updateScheduleSlot = (index: number, field: keyof ScheduleSlot, value: string | number) => {
    setSchedules(prev => prev.map((slot, i) => 
      i === index ? { ...slot, [field]: value } : slot
    ))
  }

  const removeScheduleSlot = (index: number) => {
    if (schedules.length > 1) {
      setSchedules(prev => prev.filter((_, i) => i !== index))
    }
  }

  const validateSchedules = (): string | null => {
    for (let i = 0; i < schedules.length; i++) {
      const slot = schedules[i]
      
      // 檢查時間格式
      if (!slot.startTime || !slot.endTime) {
        return `第 ${i + 1} 個時段的時間不完整`
      }
      
      // 檢查開始時間是否早於結束時間
      if (slot.startTime >= slot.endTime) {
        return `第 ${i + 1} 個時段的開始時間必須早於結束時間`
      }
      
      // 檢查同一天是否有時間重疊
      for (let j = i + 1; j < schedules.length; j++) {
        const otherSlot = schedules[j]
        if (slot.dayOfWeek === otherSlot.dayOfWeek) {
          const overlap = !(slot.endTime <= otherSlot.startTime || slot.startTime >= otherSlot.endTime)
          if (overlap) {
            const dayLabel = DAYS.find(d => d.value === slot.dayOfWeek)?.label || "未知"
            return `${dayLabel} 的時段有重疊衝突`
          }
        }
      }
    }
    return null
  }

  const handleSave = async () => {
    // 驗證時間表
    const validationError = validateSchedules()
    if (validationError) {
      alert(validationError)
      return
    }

    setIsSaving(true)
    try {
      // 準備 API 數據格式
      const apiSchedules = schedules.map(slot => ({
        day_of_week: slot.dayOfWeek,
        start_time: slot.startTime + ":00", // 添加秒數
        end_time: slot.endTime + ":00",
        location: slot.location || ""
      }))

      // 調用 API 更新課程時間
      const response = await ApiService.setCourseSchedule(course.id, apiSchedules)
      
      if (response.error) {
        throw new Error(response.error)
      }

      // 成功後通知父組件
      if (onScheduleUpdate) {
        onScheduleUpdate(course.id, schedules)
      }

      alert("課程時間設定成功！")
      setIsOpen(false)
      
      // 刷新頁面以顯示更新後的數據
      window.location.reload()
      
    } catch (error) {
      console.error("設定課程時間失敗:", error)
      alert(`設定失敗: ${error instanceof Error ? error.message : "未知錯誤"}`)
    } finally {
      setIsSaving(false)
    }
  }

  const formatTime = (time: string) => {
    // 去掉秒數，只保留 HH:MM
    return time.substring(0, 5)
  }

  const formatScheduleDisplay = () => {
    if (!course.schedule || course.schedule.length === 0) {
      return "尚未設定上課時間"
    }
    
    return course.schedule.map(slot => {
      const dayLabel = DAYS.find(d => d.value === slot.dayOfWeek)?.label || "未知"
      return `${dayLabel} ${formatTime(slot.startTime)}-${formatTime(slot.endTime)}`
    }).join(", ")
  }

  const defaultTrigger = (
    <Button variant="outline" size="sm" className="gap-2">
      <Clock className="w-4 h-4" />
      {course.schedule && course.schedule.length > 0 ? "編輯時間" : "設定時間"}
    </Button>
  )

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      
      <DialogContent className="max-w-[calc(100vw-1rem)] sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            設定課程時間 - {course.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 當前時間表顯示 */}
          <Card className="p-4 bg-muted/50">
            <div className="text-sm">
              <span className="font-medium">目前時間表：</span>
              <span className="ml-2 text-muted-foreground">{formatScheduleDisplay()}</span>
            </div>
          </Card>

          {/* 時間設定區域 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="font-medium text-base">上課時間設定</Label>
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={addScheduleSlot}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                新增時段
              </Button>
            </div>

            {schedules.map((slot, index) => (
              <Card key={index} className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">時段 {index + 1}</span>
                    {schedules.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeScheduleSlot(index)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    {/* 星期選擇 */}
                    <div>
                      <Label className="text-xs text-muted-foreground">星期</Label>
                      <select
                        value={slot.dayOfWeek}
                        onChange={(e) => updateScheduleSlot(index, "dayOfWeek", Number.parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm"
                      >
                        {DAYS.map((day) => (
                          <option key={day.value} value={day.value}>
                            {day.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* 開始時間 */}
                    <div>
                      <Label className="text-xs text-muted-foreground">開始時間</Label>
                      <Input
                        type="time"
                        value={slot.startTime}
                        onChange={(e) => updateScheduleSlot(index, "startTime", e.target.value)}
                        className="text-sm"
                        min="07:00"
                        max="22:00"
                      />
                    </div>

                    {/* 結束時間 */}
                    <div>
                      <Label className="text-xs text-muted-foreground">結束時間</Label>
                      <Input
                        type="time"
                        value={slot.endTime}
                        onChange={(e) => updateScheduleSlot(index, "endTime", e.target.value)}
                        className="text-sm"
                        min="07:00"
                        max="22:00"
                      />
                    </div>

                    {/* 地點 */}
                    <div>
                      <Label className="text-xs text-muted-foreground">地點（選填）</Label>
                      <Input
                        type="text"
                        value={slot.location || ""}
                        onChange={(e) => updateScheduleSlot(index, "location", e.target.value)}
                        placeholder="教室位置"
                        className="text-sm"
                      />
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* 操作按鈕 */}
          <div className="flex gap-3 pt-4">
            <Button 
              onClick={handleSave} 
              disabled={isSaving}
              className="flex-1 gap-2"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  儲存中...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  儲存設定
                </>
              )}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setIsOpen(false)}
              disabled={isSaving}
              className="flex-1"
            >
              取消
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}