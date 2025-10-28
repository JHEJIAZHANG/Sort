"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { EmptyStateSimple } from "@/components/empty-state"
import { ClipboardIcon } from "@/components/icons"
import type { Exam } from "@/types/course"
import { getDaysDifferenceTaiwan, isTodayTaiwan } from "@/lib/taiwan-time"

interface RecentExamsProps {
  exams: Exam[]
  courses: any[]
  selectedDate?: Date
  onViewExam?: (examId: string) => void
  onViewAllExams?: () => void
}

export function RecentExams({ exams, courses, selectedDate, onViewExam, onViewAllExams }: RecentExamsProps) {
  const viewingDate = selectedDate || new Date()
  const isViewingToday = isTodayTaiwan(viewingDate)

  const recentExams = exams
    .filter((exam) => {
      if (isViewingToday) {
        // Original logic for today
        if (exam.notificationTime) {
          const now = new Date()
          return now >= exam.notificationTime
        }
        const daysUntilExam = getDaysDifferenceTaiwan(new Date(), exam.examDate)
        return daysUntilExam <= 7 && daysUntilExam >= 0
      } else {
        // For selected date, show exams relative to that date
        const daysUntilExam = getDaysDifferenceTaiwan(viewingDate, exam.examDate)
        return daysUntilExam <= 7 && daysUntilExam >= 0
      }
    })
    .sort((a, b) => new Date(a.examDate).getTime() - new Date(b.examDate).getTime())
    .slice(0, 3)

  const getCourseName = (courseId: string) => {
    const course = courses.find((c) => c.id === courseId)
    return course?.name || "未知課程"
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const referenceDate = viewingDate
    const diffTime = date.getTime() - referenceDate.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return isViewingToday ? "今天" : "當天"
    }
    if (diffDays === 1) {
      return isViewingToday ? "明天" : "隔天"
    }
    if (diffDays > 0) return `${diffDays}天後`
    return `${Math.abs(diffDays)}天前`
  }

  const getExamColorAndText = (dateString: string) => {
    const examDate = new Date(dateString)
    const daysUntilExam = getDaysDifferenceTaiwan(viewingDate, examDate)

    if (daysUntilExam <= 0) {
      return {
        dotColor: "#ef4444", // Red
        textColor: "text-red-700",
        status: "已結束",
      }
    }
    if (daysUntilExam <= 2) {
      return {
        dotColor: "#f97316", // Orange
        textColor: "text-orange-700",
        status: "緊急",
      }
    }
    if (daysUntilExam <= 7) {
      return {
        dotColor: "#eab308", // Yellow
        textColor: "text-yellow-700",
        status: "即將到來",
      }
    }
    return {
      dotColor: "#3b82f6", // Blue
      textColor: "text-blue-700",
      status: "未來",
    }
  }

  return (
    <Card className="bg-white p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-foreground flex items-center gap-2">
          <ClipboardIcon className="w-5 h-5 text-primary" />
          最近考試
        </h2>
        <Button variant="outline" size="sm" onClick={onViewAllExams}>
          查看全部
        </Button>
      </div>

      {recentExams.length > 0 ? (
        <div className="space-y-3">
          {recentExams.map((exam) => {
            const examColorAndText = getExamColorAndText(exam.examDate.toString())
            const course = courses.find((c) => c.id === exam.courseId)

            return (
              <div
                key={exam.id}
                className="flex items-center justify-between p-2 bg-muted rounded-lg cursor-pointer hover:shadow-sm transition-shadow"
                onClick={() => onViewExam?.(exam.id)}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-1 h-8 flex-shrink-0 rounded-sm"
                    style={{ backgroundColor: examColorAndText.dotColor }}
                  />
                  <div>
                    <p className="text-sm font-medium text-foreground">{exam.title}</p>
                    <p className="text-xs text-muted-foreground">{getCourseName(exam.courseId)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-xs font-medium ${examColorAndText.textColor}`}>{formatDate(exam.examDate.toString())}</p>
                  <p className="text-xs text-slate-600">{new Date(exam.examDate).toLocaleDateString("zh-TW")}</p>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <EmptyStateSimple
          title="暫無即將到來的考試"
          description="新增考試資訊來做好準備"
          showAction={false}
        />
      )}
    </Card>
  )
}
