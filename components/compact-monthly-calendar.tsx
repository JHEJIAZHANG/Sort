"use client"

import { useState, useEffect } from "react"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { getTaiwanTime } from "@/lib/taiwan-time"
import { ApiService } from "@/services/apiService"
import type { Assignment, Exam } from "@/types/course"
import useSWR from "swr"

interface CalendarEvent {
  id: string
  title: string
  date: Date
  time: string // Added time field for events
  type: "assignment" | "exam" | "course" | "note" | "google_event"
  color: string
}

interface CompactMonthlyCalendarProps {
  className?: string
  selectedDate?: Date
  onDateSelect?: (date: Date) => void
  assignments?: Assignment[]
  exams?: Exam[]
}

export function CompactMonthlyCalendar({ className, selectedDate, onDateSelect, assignments = [], exams = [] }: CompactMonthlyCalendarProps) {
  const [currentDate, setCurrentDate] = useState(getTaiwanTime())
  const [showYearPicker, setShowYearPicker] = useState(false)
  const [showMonthPicker, setShowMonthPicker] = useState(false)
  // const [googleEvents, setGoogleEvents] = useState<CalendarEvent[]>([])

  const defaultEvents: CalendarEvent[] = []

  useEffect(() => {
    if (selectedDate) {
      setCurrentDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1))
    }
  }, [selectedDate])

  const today = getTaiwanTime()
  const currentMonth = currentDate.getMonth()
  const currentYear = currentDate.getFullYear()

  // 使用 SWR 載入當月 Google Calendar 事件（自動輪詢，避免整頁刷新）
  const { data: googleEventsData } = useSWR(
    ["google-events", currentYear, currentMonth],
    async () => {
      const monthStart = new Date(currentYear, currentMonth, 1)
      const monthEnd = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59)
      const response = await ApiService.getCalendarEvents({
        time_min: monthStart.toISOString(),
        time_max: monthEnd.toISOString(),
        max_results: 250,
      })
      const rawEvents = Array.isArray(response.data?.data) ? (response.data!.data as any[]) : []
      const mapped: CalendarEvent[] = rawEvents.map((ev) => {
        const start = ev.start?.dateTime || ev.start?.date
        const dateObj = start ? new Date(start) : new Date()
        const timeStr = ev.start?.dateTime
          ? new Date(ev.start.dateTime).toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit" })
          : "全天"
        return {
          id: ev.id,
          title: ev.summary || "(無標題)",
          date: dateObj,
          time: timeStr,
          type: "google_event",
          color: "bg-red-500",
        }
      })
      return mapped
    },
    {
      refreshInterval: 60_000,
      revalidateOnFocus: false,
    }
  )
  const googleEvents = googleEventsData ?? []

  // Get first day of month and number of days using Taiwan time
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1)
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0)
  const daysInMonth = lastDayOfMonth.getDate()
  
  // Use Taiwan time to get the correct day of week
  const taiwanFirstDay = new Date(firstDayOfMonth.getTime() + (8 * 60 * 60 * 1000)) // UTC+8
  const startingDayOfWeek = taiwanFirstDay.getUTCDay()

  // Adjust for Monday start (0 = Sunday, 1 = Monday, etc.)
  const adjustedStartDay = startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1

  const monthNames = [
    "一月",
    "二月",
    "三月",
    "四月",
    "五月",
    "六月",
    "七月",
    "八月",
    "九月",
    "十月",
    "十一月",
    "十二月",
  ]

  const dayNames = ["一", "二", "三", "四", "五", "六", "日"]

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1))
  }

  const isToday = (day: number) => {
    return today.getDate() === day && today.getMonth() === currentMonth && today.getFullYear() === currentYear
  }

  const isSelected = (day: number) => {
    if (!selectedDate) return false
    return (
      selectedDate.getDate() === day &&
      selectedDate.getMonth() === currentMonth &&
      selectedDate.getFullYear() === currentYear
    )
  }

  const getEventsCountForDay = (day: number) => {
    const isSameDay = (d: Date) => d.getDate() === day && d.getMonth() === currentMonth && d.getFullYear() === currentYear
    const googleCount = googleEvents.filter((e) => isSameDay(e.date)).length
    const assignmentCount = assignments.filter((a) => isSameDay(a.dueDate)).length
    const examCount = exams.filter((e) => isSameDay(e.examDate)).length
    return googleCount + assignmentCount + examCount
  }

  const getDailySchedule = (date: Date) => {
    const dayEvents = googleEvents.filter(
      (event) =>
        event.date.getDate() === date.getDate() &&
        event.date.getMonth() === date.getMonth() &&
        event.date.getFullYear() === date.getFullYear()
    )

    // 依時間排序（將「全天」排在最前）
    return dayEvents.sort((a, b) => {
      if (a.time === "全天" && b.time !== "全天") return -1
      if (a.time !== "全天" && b.time === "全天") return 1
      return a.time.localeCompare(b.time)
    })
  }

  const handleDateClick = (day: number) => {
    if (onDateSelect) {
      const newDate = new Date(currentYear, currentMonth, day)
      onDateSelect(newDate)
    }
  }

  // Generate calendar days
  const calendarDays = []

  // Add empty cells for days before month starts
  for (let i = 0; i < adjustedStartDay; i++) {
    calendarDays.push(null)
  }

  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day)
  }

  return (
    <div className={`w-full max-w-full space-y-2 sm:space-y-3 ${className}`}>
      <Card className="p-3 sm:p-4 w-full max-w-full overflow-hidden">
        {/* Header with month navigation */}
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={goToPreviousMonth} 
            className="h-8 w-8 sm:h-9 sm:w-9 p-0 shrink-0"
          >
            <ChevronLeftIcon className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowYearPicker(!showYearPicker)
                setShowMonthPicker(false)
              }}
              className="h-8 px-2 font-medium text-sm sm:text-base hover:bg-accent"
            >
              {currentYear}年
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowMonthPicker(!showMonthPicker)
                setShowYearPicker(false)
              }}
              className="h-8 px-2 font-medium text-sm sm:text-base hover:bg-accent"
            >
              {monthNames[currentMonth]}
            </Button>
          </div>

          <Button 
            variant="ghost" 
            size="sm" 
            onClick={goToNextMonth} 
            className="h-8 w-8 sm:h-9 sm:w-9 p-0 shrink-0"
          >
            <ChevronRightIcon className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
        </div>
        
        {/* 年份選擇器 */}
        {showYearPicker && (
          <div className="grid grid-cols-3 gap-2 mb-3 max-h-48 overflow-y-auto p-2 border rounded-md">
            {Array.from({ length: 21 }, (_, i) => currentYear - 10 + i).map((year) => (
              <Button
                key={year}
                variant={year === currentYear ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setCurrentDate(new Date(year, currentMonth, 1))
                  setShowYearPicker(false)
                }}
                className="h-8 text-xs sm:text-sm"
              >
                {year}
              </Button>
            ))}
          </div>
        )}
        
        {/* 月份選擇器 */}
        {showMonthPicker && (
          <div className="grid grid-cols-3 gap-2 mb-3 p-2 border rounded-md">
            {monthNames.map((month, index) => (
              <Button
                key={index}
                variant={index === currentMonth ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setCurrentDate(new Date(currentYear, index, 1))
                  setShowMonthPicker(false)
                }}
                className="h-8 text-xs sm:text-sm"
              >
                {month}
              </Button>
            ))}
          </div>
        )}

        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2 sm:mb-3">
          {dayNames.map((day) => (
            <div key={day} className="text-center text-xs sm:text-sm font-medium text-muted-foreground py-1 sm:py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {calendarDays.map((day, index) => {
            const dayEventsCount = day ? getEventsCountForDay(day) : 0

            return (
              <div
                key={index}
                className={`
                  aspect-square flex flex-col items-center justify-center text-xs sm:text-sm rounded-md p-1 sm:p-2 relative min-h-[40px] sm:min-h-[48px]
                  ${day === null ? "" : "hover:bg-accent cursor-pointer transition-colors duration-200"}
                  ${day === null ? "text-transparent" : ""}
                `}
                onClick={day ? () => handleDateClick(day) : undefined}
              >
                {day && (
                  <>
                    <span
                      className={`
                        flex items-center justify-center font-medium transition-all duration-200
                        ${isToday(day) 
                          ? "bg-primary text-primary-foreground rounded-full w-6 h-6 sm:w-7 sm:h-7 text-xs sm:text-sm" 
                          : ""
                        }
                        ${isSelected(day) && !isToday(day) 
                          ? "border border-primary rounded-full w-6 h-6 sm:w-7 sm:h-7 text-primary text-xs sm:text-sm" 
                          : ""
                        }
                        ${!isToday(day) && !isSelected(day) ? "text-xs sm:text-sm" : ""}
                      `}
                    >
                      {day}
                    </span>
                    {dayEventsCount > 0 && (
                      <div className="flex items-center justify-center gap-1 mt-1 absolute bottom-1 left-1/2 transform -translate-x-1/2">
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-primary" title={`有 ${dayEventsCount} 個事件/作業`} />
                        {dayEventsCount > 1 && (
                          <span className="text-[10px] sm:text-xs text-primary font-medium">{dayEventsCount}</span>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            )
          })}
        </div>
      </Card>

      {selectedDate && (
        <Card className="p-3 sm:p-4 mt-3 sm:mt-4 w-full max-w-full overflow-hidden">
          <h4 className="font-medium text-sm sm:text-base mb-3 sm:mb-4 text-center sm:text-left">
            {selectedDate.getMonth() + 1}月{selectedDate.getDate()}日 行程
          </h4>
          <div className="space-y-2 sm:space-y-3">
            {getDailySchedule(selectedDate).length > 0 ? (
              getDailySchedule(selectedDate).map((item, index) => (
                <div key={index} className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-muted/50 rounded-md text-xs sm:text-sm">
                  <div className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full shrink-0 ${
                    item.type === 'assignment' ? 'bg-blue-500' : 
                    item.type === 'exam' ? 'bg-red-500' : 'bg-green-500'
                  }`} />
                  <span className="font-medium truncate flex-1">{item.title}</span>
                  {item.time && (
                    <span className="text-muted-foreground shrink-0 text-xs sm:text-sm">{item.time}</span>
                  )}
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-center text-xs sm:text-sm py-3 sm:py-4">
                今日沒有安排
              </p>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}
