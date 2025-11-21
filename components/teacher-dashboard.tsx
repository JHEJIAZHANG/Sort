"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { CheckIcon } from "./icons"
import type { Course, Assignment } from "@/types/course"
import { ScrollSummary } from "./scroll-summary"
import { UpcomingSchedule } from "./upcoming-schedule"
import { CompactMonthlyCalendar } from "./compact-monthly-calendar"
import { getTaiwanTime, getDaysDifferenceTaiwan } from "@/lib/taiwan-time"
import { EmptyStateSimple } from "./empty-state"

interface TeacherDashboardProps {
  courses: Course[]
  assignments?: Assignment[]
  onCourseClick: (course: Course) => void
  onAddCourse: () => void
  onManageGroups: (courseId: string) => void
  onRemindStudents: (courseId: string) => void
  user?: {
    name: string
    isLoggedIn: boolean
  }
}

export function TeacherDashboard({
  courses,
  assignments = [],
  user
}: TeacherDashboardProps) {
  const [selectedDate, setSelectedDate] = useState(getTaiwanTime())

  // 篩選7天內即將到期的作業
  const upcomingAssignments = assignments.filter((assignment) => {
    const daysUntilDue = getDaysDifferenceTaiwan(new Date(), assignment.dueDate)
    return daysUntilDue >= 0 && daysUntilDue <= 7 && assignment.status !== "completed"
  }).sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())

  const getAssignmentColor = (assignment: Assignment) => {
    const daysUntil = getDaysDifferenceTaiwan(new Date(), assignment.dueDate)
    if (daysUntil <= 0) return "#ef4444" // Red for today/overdue
    if (daysUntil <= 1) return "#f97316" // Orange for tomorrow
    if (daysUntil <= 3) return "#eab308" // Yellow for soon
    return "#3b82f6" // Blue for future
  }

  const getAssignmentTextColor = (assignment: Assignment) => {
    const daysUntil = getDaysDifferenceTaiwan(new Date(), assignment.dueDate)
    if (daysUntil <= 0) return "text-red-700"
    if (daysUntil <= 1) return "text-orange-700"
    if (daysUntil <= 3) return "text-yellow-700"
    return "text-blue-700"
  }

  const formatDueDate = (dueDate: Date) => {
    const daysUntil = getDaysDifferenceTaiwan(new Date(), dueDate)
    if (daysUntil === 0) return "今天"
    if (daysUntil === 1) return "明天"
    if (daysUntil > 0) return `${daysUntil}天後`
    return `${Math.abs(daysUntil)}天前`
  }

  const getCourseById = (courseId: string) => {
    return courses.find((c) => c.id === courseId)
  }

  return (
    <div className="space-y-6 lg:grid lg:grid-cols-5 lg:gap-4 xl:gap-6 lg:space-y-0 mb-6 max-w-full overflow-hidden pb-24 pb-safe">
      {/* 左側欄位 */}
      <div className="lg:col-span-2 lg:space-y-6">
        {/* 摘要 */}
        <ScrollSummary
          courses={courses}
          assignments={assignments}
          exams={[]}
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          user={user}
        />

        {/* 近期課程 */}
        <UpcomingSchedule courses={courses} selectedDate={selectedDate} />

        {/* 最近作業區塊 */}
        <Card className="bg-white p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <CheckIcon className="w-5 h-5 text-primary" />
              最近作業
            </h2>
          </div>

          {upcomingAssignments.length > 0 ? (
            <div className="space-y-3">
              {upcomingAssignments.slice(0, 5).map((assignment) => {
                const course = getCourseById(assignment.courseId)
                return (
                  <div
                    key={assignment.id}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg hover:shadow-sm transition-shadow cursor-pointer"
                  >
                    <div className="flex items-center gap-2 flex-1">
                      <div
                        className="w-1 h-8 flex-shrink-0 rounded-sm"
                        style={{ backgroundColor: getAssignmentColor(assignment) }}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-foreground">
                            {assignment.title || "未命名作業"}
                          </p>
                          <span className="text-xs px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded">
                            作業
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {course?.name || "未知課程"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-xs font-medium ${getAssignmentTextColor(assignment)}`}>
                        {formatDueDate(assignment.dueDate)}
                      </p>
                      <p className="text-xs text-slate-600">
                        {assignment.dueDate.toLocaleDateString("zh-TW")}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <EmptyStateSimple
              title="暫無即將到期的作業"
              description="7天內沒有作業到期"
              showAction={false}
            />
          )}

          <div className="mt-3 pt-3 border-t border-border">
            <p className="text-xs text-muted-foreground text-center">
              顯示 7 天內即將到期的作業
            </p>
          </div>
        </Card>
      </div>

      {/* 右側欄位 - 月曆 */}
      <div className="lg:col-span-3 w-full max-w-full">
        <div className="w-full max-w-md mx-auto lg:max-w-full">
          <CompactMonthlyCalendar
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
            assignments={assignments}
            exams={[]}
          />
        </div>
      </div>
    </div>
  )
}