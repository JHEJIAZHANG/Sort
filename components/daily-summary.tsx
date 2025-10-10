"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { EmptyStateSimple } from "@/components/empty-state"
import { ChevronDownIcon, ChevronUpIcon } from "@/components/icons"
import type { Course, Assignment, Exam } from "@/types/course"
import { getTaiwanTime } from "@/lib/taiwan-time"

interface DailySummaryProps {
  courses: Course[]
  assignments: Assignment[]
  exams: Exam[]
  user?: {
    name: string
    isLoggedIn: boolean
  }
}

export function DailySummary({ courses, assignments, exams, user }: DailySummaryProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const today = getTaiwanTime()
  // 將 JavaScript 的 getDay() 結果轉換為後端格式
  // JavaScript Date: 0=週日, 1=週一, 2=週二, 3=週三, 4=週四, 5=週五, 6=週六
  // 我們的系統: 0=週一, 1=週二, 2=週三, 3=週四, 4=週五, 5=週六, 6=週日
  const todayDay = today.getDay() === 0 ? 6 : today.getDay() - 1

  // Get today's courses
  const todayCourses = courses.filter((course) => course.schedule.some((slot) => slot.dayOfWeek === todayDay))

  // Get today's assignments (due today)
  const todayAssignments = assignments.filter((assignment) => {
    const dueDate = new Date(assignment.dueDate)
    return dueDate.toDateString() === today.toDateString() && assignment.status !== "completed"
  })

  // Get today's exams
  const todayExams = exams.filter((exam) => {
    const examDate = new Date(exam.examDate)
    return examDate.toDateString() === today.toDateString() && exam.status !== "completed"
  })

  // Calculate free time (after the last class)
  const getFreeTime = () => {
    if (todayCourses.length === 0) return "全天"

    let latestEndTime = 0
    todayCourses.forEach((course) => {
      course.schedule.forEach((slot) => {
        if (slot.dayOfWeek === todayDay) {
          const endHour = Number.parseInt(slot.endTime.split(":")[0])
          const endMinute = Number.parseInt(slot.endTime.split(":")[1])
          const endTimeInMinutes = endHour * 60 + endMinute
          if (endTimeInMinutes > latestEndTime) {
            latestEndTime = endTimeInMinutes
          }
        }
      })
    })

    const hours = Math.floor(latestEndTime / 60)
    const minutes = latestEndTime % 60
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`
  }

  const freeTime = getFreeTime()

  return (
    <Card className="bg-white mb-4 overflow-hidden">
      <div className="p-4 cursor-pointer select-none" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-foreground">
            {user?.isLoggedIn ? `${user.name}，今日摘要` : "Username，今日摘要"}
          </h3>
          {isExpanded ? (
            <ChevronUpIcon className="w-5 h-5 text-muted-foreground" />
          ) : (
            <ChevronDownIcon className="w-5 h-5 text-muted-foreground" />
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="px-4 pb-4 pt-0 space-y-3 text-sm">
          {/* Course summary */}
          <div>
            {todayCourses.length > 0 ? (
              <p className="text-foreground">
                您今天有 <span className="font-medium text-orange-600">{todayCourses.length}</span> 堂課
                {todayCourses.length <= 2 && (
                  <>
                    ，分別為
                    {todayCourses.map((course, index) => (
                      <span key={course.id}>
                        <span className="font-medium text-orange-600">{course.name}</span>
                        {index < todayCourses.length - 1 && "和"}
                      </span>
                    ))}
                  </>
                )}
              </p>
            ) : (
              <div className="py-2">
                <p className="text-muted-foreground text-sm">今天沒有課程安排</p>
              </div>
            )}
          </div>

          {/* Assignment and exam summary */}
          <div>
            {todayAssignments.length > 0 || todayExams.length > 0 ? (
              <p className="text-foreground">
                {todayAssignments.length > 0 && (
                  <>
                    <span className="font-medium text-orange-600">{todayAssignments.length}</span> 個作業
                  </>
                )}
                {todayAssignments.length > 0 && todayExams.length > 0 && "和"}
                {todayExams.length > 0 && (
                  <>
                    <span className="font-medium text-red-600">{todayExams.length}</span> 個考試
                  </>
                )}
                到期
              </p>
            ) : (
              <div className="py-2">
                <p className="text-muted-foreground text-sm">今天沒有作業或考試到期</p>
              </div>
            )}
          </div>

          {/* Free time */}
          <div>
            {freeTime === "全天" ? (
              <p className="text-green-600">
                今天您有<span className="font-medium">一整天</span>的空閒時間
              </p>
            ) : (
              <p className="text-foreground">
                今天<span className="font-medium">{freeTime}</span>後就是您的空閒時間
              </p>
            )}
          </div>
        </div>
      )}
    </Card>
  )
}
