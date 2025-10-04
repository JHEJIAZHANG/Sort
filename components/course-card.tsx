"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CalendarIcon } from "@/components/icons"
import { Users, Clock, ExternalLink } from "lucide-react"
import { CourseScheduleEditor } from "@/components/course-schedule-editor"
import type { Course } from "@/types/course"

interface CourseCardProps {
  course: Course
  onClick: () => void
}

const DAYS = ["週一", "週二", "週三", "週四", "週五", "週六", "週日"]

export function CourseCard({ course, onClick }: CourseCardProps) {
  const formatTime = (time: string) => {
    // 去掉秒數，只保留 HH:MM
    return time.substring(0, 5)
  }

  const formatSchedule = () => {
    return course.schedule.map((slot) => `${DAYS[slot.dayOfWeek]} ${formatTime(slot.startTime)}-${formatTime(slot.endTime)}`).join(", ")
  }

  return (
    <Card
      className="p-4 sm:p-6 cursor-pointer hover-lift hover:shadow-xl transition-all duration-300 ease-out bg-card hover:bg-card/80 relative group animate-fade-in border-l-4 mobile-card"
      style={{ borderLeftColor: course.color }}
      onClick={onClick}
    >
      <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg" />
      <div className="relative z-10">
        <div className="flex items-start gap-3 sm:gap-4">
        <div className="flex-1 min-w-0">
          <div className="mb-2">
            <h3 className="font-semibold text-foreground text-balance text-base sm:text-lg leading-tight mb-2">{course.name}</h3>
            {course.source === "google_classroom" && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 w-fit">
                  Google Classroom
                </span>
                {course.googleClassroomUrl && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 flex-shrink-0 touch-manipulation"
                    onClick={(e) => {
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
          </div>

          {course.instructor && <p className="text-sm text-muted-foreground mt-2 font-medium">{course.instructor}</p>}

          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-3 text-xs text-muted-foreground">
            {course.schedule.length > 0 && (
              <div className="flex items-center gap-1.5">
                <CalendarIcon className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="font-medium break-words">{formatSchedule()}</span>
              </div>
            )}
            {course.studentCount && course.source === "google_classroom" && (
              <div className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="font-medium">{course.studentCount} 位學生</span>
              </div>
            )}
          </div>

          {course.classroom && (
            <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
              <span className="font-medium break-words">📍 {course.classroom}</span>
            </div>
          )}

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
          </div>
        </div>
      </div>
    </Card>
  )
}
