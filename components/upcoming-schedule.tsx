"use client"

import { Card } from "@/components/ui/card"
import { CalendarIcon } from "@/components/icons"
import type { Course } from "@/types/course"
import { getTaiwanTime, isTodayTaiwan } from "@/lib/taiwan-time"

interface UpcomingScheduleProps {
  courses: Course[]
  selectedDate?: Date
}

const DAYS = ["週一", "週二", "週三", "週四", "週五", "週六", "週日"]
const PRIMARY_COLOR = "#ff9100" // 統一使用主色調橘色

// 將 JavaScript 的 getDay() 結果轉換為後端格式
// JavaScript Date: 0=週日, 1=週一, 2=週二, 3=週三, 4=週四, 5=週五, 6=週六
  // 我們的系統: 0=週一, 1=週二, 2=週三, 3=週四, 4=週五, 5=週六, 6=週日
const convertJsDayToBackend = (jsDay: number): number => {
  return jsDay === 0 ? 6 : jsDay - 1
}

const formatTime = (time: string) => {
  // 去掉秒數，只保留 HH:MM
  return time.substring(0, 5)
}

export function UpcomingSchedule({ courses, selectedDate }: UpcomingScheduleProps) {
  const today = getTaiwanTime()
  const viewingDate = selectedDate || today
  const isViewingToday = isTodayTaiwan(viewingDate)
  const currentDay = convertJsDayToBackend(viewingDate.getDay())
  const currentTime = today.toTimeString().slice(0, 5)

  const upcomingDays = []

  if (isViewingToday) {
    // If viewing today, show today and tomorrow as before
    for (let i = 0; i < 2; i++) {
      const targetDay = (currentDay + i) % 7
      const targetDate = new Date(viewingDate)
      targetDate.setDate(viewingDate.getDate() + i)

      const dayCourses = courses.filter((course) => course.schedule.some((slot) => slot.dayOfWeek === targetDay))

      if (dayCourses.length > 0) {
        const filteredCourses = dayCourses
          .flatMap((course) =>
            course.schedule.filter((slot) => slot.dayOfWeek === targetDay).map((slot) => ({ course, slot })),
          )
          .filter((item) => {
            // For today (dayOffset === 0), only show courses that haven't ended yet
            if (i === 0) {
              return item.slot.endTime > currentTime
            }
            // For tomorrow and beyond, show all courses
            return true
          })
          .sort((a, b) => a.slot.startTime.localeCompare(b.slot.startTime))

        if (filteredCourses.length > 0) {
          upcomingDays.push({
            day: targetDay,
            date: targetDate,
            courses: filteredCourses,
            dayOffset: i,
          })
        }
      }
    }
  } else {
    // If viewing a different date, only show courses for that specific date
    const dayCourses = courses.filter((course) => course.schedule.some((slot) => slot.dayOfWeek === currentDay))

    if (dayCourses.length > 0) {
      const filteredCourses = dayCourses
        .flatMap((course) =>
          course.schedule.filter((slot) => slot.dayOfWeek === currentDay).map((slot) => ({ course, slot })),
        )
        .sort((a, b) => a.slot.startTime.localeCompare(b.slot.startTime))

      if (filteredCourses.length > 0) {
        upcomingDays.push({
          day: currentDay,
          date: viewingDate,
          courses: filteredCourses,
          dayOffset: 0,
        })
      }
    }
  }

  const sectionTitle = isViewingToday ? "近期課程" : `${viewingDate.getMonth() + 1}/${viewingDate.getDate()}課程`

  const emptyMessage = isViewingToday ? "今明兩天無課程安排" : "該日期無課程安排"

  if (upcomingDays.length === 0) {
    return (
      <Card className="p-4 mb-4">
        <h2 className="font-semibold text-foreground mb-3 flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-amber-600" />
          {sectionTitle}
        </h2>
        <p className="text-muted-foreground text-center py-4">{emptyMessage}</p>
      </Card>
    )
  }

  return (
    <Card className="p-4 mb-4">
      <h2 className="font-semibold text-foreground mb-3 flex items-center gap-2">
        <CalendarIcon className="w-5 h-5 text-amber-600" />
        {sectionTitle}
      </h2>
      <div className="space-y-4">
        {upcomingDays.map((day, dayIndex) => (
          <div key={dayIndex}>
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-sm font-medium text-foreground">
                {DAYS[day.day]} {day.date.toLocaleDateString("zh-TW", { month: "numeric", day: "numeric" })}
              </h3>
              {isViewingToday && day.dayOffset === 0 && (
                <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full">今天</span>
              )}
              {isViewingToday && day.dayOffset === 1 && (
                <span className="text-xs px-2 py-1 bg-chart-5/10 text-chart-5 rounded-full">明天</span>
              )}
              {!isViewingToday && (
                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">所選日期</span>
              )}
            </div>
            <div className="space-y-2">
              {day.courses.map((item, courseIndex) => (
                <div key={courseIndex} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-8 flex-shrink-0 rounded-sm" style={{ backgroundColor: PRIMARY_COLOR }} />
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.course.name}</p>
                      <p className="text-xs text-muted-foreground">{item.course.classroom || "未指定教室"}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium text-foreground">{formatTime(item.slot.startTime)}</p>
                    <p className="text-xs text-muted-foreground">
                      {(() => {
                        try {
                          // 確保時間格式正確（移除可能存在的秒數）
                          const startTime = item.slot.startTime.substring(0, 5)
                          const endTime = item.slot.endTime.substring(0, 5)
                          
                          const start = new Date(`2000-01-01T${startTime}:00`)
                          const end = new Date(`2000-01-01T${endTime}:00`)
                          
                          const durationMs = end.getTime() - start.getTime()
                          const durationHours = durationMs / (1000 * 60 * 60)
                          
                          // 檢查是否為有效數字
                          if (isNaN(durationHours) || durationHours < 0) {
                            return "- h"
                          }
                          
                          // 如果小於1小時，顯示分鐘數
                          if (durationHours < 1) {
                            const durationMinutes = Math.round(durationMs / (1000 * 60))
                            return `${durationMinutes}分`
                          }
                          
                          return `${Math.round(durationHours * 10) / 10}h`
                        } catch (error) {
                          return "- h"
                        }
                      })()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
