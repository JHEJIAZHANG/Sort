"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CalendarIcon, UserIcon, LinkIcon, BellIcon } from "./icons"
import { Users, MessageCircle, ExternalLink, Settings } from "lucide-react"
import type { Course } from "@/types/course"

interface TeacherCourseCardProps {
  course: Course & {
    studentCount?: number
    lineGroupCount?: number
    submissionRate?: number
    pendingAssignments?: number
  }
  onClick: (course: Course) => void
  onManageGroups?: (courseId: string) => void
  onRemindStudents?: (courseId: string) => void
}

const PRIMARY_COLOR = "#ff9100"

export function TeacherCourseCard({ 
  course, 
  onClick, 
  onManageGroups, 
  onRemindStudents 
}: TeacherCourseCardProps) {
  const formatTime = (time: string) => {
    return time.substring(0, 5)
  }

  const formatSchedule = () => {
    const DAYS = ["週一", "週二", "週三", "週四", "週五", "週六", "週日"]
    return course.schedule
      .map((slot: any) => `${DAYS[slot.dayOfWeek]} ${formatTime(slot.startTime)}-${formatTime(slot.endTime)}`)
      .join(", ")
  }

  const handleCardClick = () => {
    onClick(course)
  }

  const handleManageGroups = (e: React.MouseEvent) => {
    e.stopPropagation()
    onManageGroups?.(course.id)
  }

  const handleRemindStudents = (e: React.MouseEvent) => {
    e.stopPropagation()
    onRemindStudents?.(course.id)
  }

  return (
    <Card
      className="p-4 sm:p-6 cursor-pointer hover-lift hover:shadow-xl transition-all duration-300 ease-out bg-card hover:bg-card/80 relative group animate-fade-in border-l-4 mobile-card"
      style={{ borderLeftColor: PRIMARY_COLOR }}
      onClick={handleCardClick}
    >
      <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg" />
      <div className="relative z-10">
        {/* 課程標題和代碼 */}
        <div className="mb-4">
          <div className="flex items-start justify-between gap-3 mb-2">
            <h3 className="font-semibold text-foreground text-balance text-base sm:text-lg leading-tight">
              {course.name}
            </h3>
            {course.source === "google_classroom" && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                Google Classroom
              </Badge>
            )}
          </div>
          {course.courseCode && (
            <p className="text-sm text-muted-foreground font-mono">
              課程代碼: {course.courseCode}
            </p>
          )}
        </div>

        {/* 統計資訊 */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            <span className="text-sm text-muted-foreground">
              學生數: <span className="font-medium text-foreground">{course.studentCount || 0}</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-green-600" />
            <span className="text-sm text-muted-foreground">
              LINE群組: <span className="font-medium text-foreground">{course.lineGroupCount || 0}</span>
            </span>
          </div>
        </div>

        {/* 課程時間 */}
        {course.schedule && course.schedule.length > 0 && (
          <div className="flex items-center gap-2 mb-4">
            <CalendarIcon className="w-4 h-4 text-primary flex-shrink-0" />
            <span className="text-sm text-muted-foreground text-balance">
              {formatSchedule()}
            </span>
          </div>
        )}

        {/* 作業統計 */}
        {(course.submissionRate !== undefined || course.pendingAssignments !== undefined) && (
          <div className="flex items-center gap-4 mb-4 p-3 bg-muted/50 rounded-lg">
            {course.submissionRate !== undefined && (
              <div className="text-center">
                <div className="text-lg font-semibold text-foreground">
                  {course.submissionRate}%
                </div>
                <div className="text-xs text-muted-foreground">繳交率</div>
              </div>
            )}
            {course.pendingAssignments !== undefined && (
              <div className="text-center">
                <div className="text-lg font-semibold text-foreground">
                  {course.pendingAssignments}
                </div>
                <div className="text-xs text-muted-foreground">待繳作業</div>
              </div>
            )}
          </div>
        )}

        {/* 操作按鈕 */}
        <div className="flex gap-2 pt-2 border-t border-border">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-8 text-xs"
            onClick={handleManageGroups}
          >
            <Settings className="w-3 h-3 mr-1" />
            群組管理
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-8 text-xs"
            onClick={handleRemindStudents}
          >
            <BellIcon className="w-3 h-3 mr-1" />
            一鍵提醒
          </Button>
          {course.googleClassroomUrl && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 flex-shrink-0"
              onClick={(e: React.MouseEvent) => {
              e.stopPropagation()
              window.open(course.googleClassroomUrl, '_blank')
            }}
              title="前往 Google Classroom"
            >
              <ExternalLink className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}