"use client"

import type React from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CalendarIcon } from "@/components/icons"
import { Users, Clock, ExternalLink } from "lucide-react"
import { CourseScheduleEditor } from "@/components/course-schedule-editor"
import type { Course } from "@/types/course"

interface CourseCardProps {
  course: Course
  onClick: (course?: Course) => void
  isSelected?: boolean
  isSelectionMode?: boolean
  onSelectionChange?: (courseId: string, selected: boolean) => void
  // 相容教師頁面
  showCheckbox?: boolean
  onEdit?: () => void
}

const DAYS = ["週一", "週二", "週三", "週四", "週五", "週六", "週日"]
const PRIMARY_COLOR = "#ff9100" // 統一使用主色調橘色

export function CourseCard({ course, onClick, isSelected, isSelectionMode, onSelectionChange, showCheckbox, onEdit }: CourseCardProps) {
  const inSelectionMode = (isSelectionMode ?? showCheckbox) === true

  const formatTime = (time: string) => {
    // 去掉秒數，只保留 HH:MM
    return time.substring(0, 5)
  }

  const formatSchedule = () => {
    return course.schedule.map((slot) => `${DAYS[slot.dayOfWeek]} ${formatTime(slot.startTime)}-${formatTime(slot.endTime)}`).join(", ")
  }

  const handleClick = () => {
    if (inSelectionMode && onSelectionChange) {
      onSelectionChange(course.id, !isSelected)
    } else {
      onClick(course)
    }
  }

  return (
    <Card
      className={`p-4 sm:p-6 cursor-pointer hover-lift hover:shadow-xl transition-all duration-300 ease-out bg-card hover:bg-card/80 relative group animate-fade-in border-l-4 mobile-card ${
        isSelected ? 'ring-2 ring-blue-500' : ''
      }`}
      style={{ borderLeftColor: PRIMARY_COLOR }}
      onClick={handleClick}
    >
      <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg" />
      <div className="relative z-10">
        <div className="flex items-start gap-3 sm:gap-4">
          {inSelectionMode && (
            <div className="flex-shrink-0 mt-1">
              <input
                type="checkbox"
                checked={isSelected || false}
                onChange={() => {}} // 由 onClick 處理
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            {/* 標題 + 課程代碼徽章 */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-2">
              <h3 className="font-semibold text-foreground text-balance text-base sm:text-lg leading-tight">{course.name}</h3>
              {course.courseCode && (
                <Badge variant="outline" className="text-foreground">
                  {course.courseCode}
                </Badge>
              )}
            </div>

            {/* Google Classroom 標籤與連結 */}
            {course.source === "google_classroom" && (
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 w-fit">
                  Google Classroom
                </span>
                {course.googleClassroomUrl && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 flex-shrink-0 touch-manipulation"
                    onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                      e.stopPropagation()
                      window.open(course.googleClassroomUrl, '_blank')
                    }}
                    title="前往 Google Classroom"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                )}
              </div>
            )}

            {course.instructor && <p className="text-sm text-muted-foreground mt-1 font-medium">{course.instructor}</p>}

            {/* 課程時間 */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-3 text-xs text-muted-foreground">
              {course.schedule.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <CalendarIcon className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="font-medium break-words">{formatSchedule()}</span>
                </div>
              )}
            </div>

            {/* 地點 */}
            {course.classroom && (
              <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
                <span className="font-medium break-words">📍 {course.classroom}</span>
              </div>
            )}

            {/* 尚未設定時間（Google Classroom） */}
            {course.source === "google_classroom" && course.schedule.length === 0 && (
              <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="text-xs text-muted-foreground italic">尚未設定上課時間</div>
                <CourseScheduleEditor 
                  course={course}
                  onScheduleUpdate={(courseId, schedules) => {
                    // 可以在這裡觸發頁面重新載入或狀態更新
                  }}
                  trigger={
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-9 px-3 text-sm w-fit touch-manipulation"
                      onClick={(e) => e.stopPropagation()} // 防止觸發卡片點擊事件
                    >
                      <Clock className="w-4 h-4 mr-1.5" />
                      設定時間
                    </Button>
                  }
                />
              </div>
            )}

            {/* 學生人數 */}
            {typeof course.studentCount === 'number' && (
              <p className="text-sm text-muted-foreground mt-3 mb-2">{course.studentCount} 位學生</p>
            )}

            {/* 查看詳情按鈕 */}
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Button
                className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                onClick={(e: React.MouseEvent<HTMLButtonElement>) => { e.stopPropagation(); onClick(course) }}
              >
                查看詳情
              </Button>
              {onEdit && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={(e: React.MouseEvent<HTMLButtonElement>) => { e.stopPropagation(); onEdit() }}
                >
                  編輯
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
