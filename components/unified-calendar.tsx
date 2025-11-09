"use client"

import { useState, useEffect } from "react"
import type { Course } from "@/types/course"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CalendarIcon, RefreshIcon } from "@/components/icons"
import { ApiService } from "@/services/apiService"

interface CalendarEvent {
  id: string
  summary: string
  description?: string
  start: {
    dateTime?: string
    date?: string
  }
  end: {
    dateTime?: string
    date?: string
  }
  location?: string
}

interface UnifiedCalendarProps {
  courses: Course[]
  onCourseClick: (courseId: string) => void
  onEventClick?: (event: CalendarEvent) => void
}

const DAYS = ["週一", "週二", "週三", "週四", "週五", "週六", "週日"]

type ViewMode = "weekdays" | "all" | "courses"

export function UnifiedCalendar({ courses, onCourseClick, onEventClick }: UnifiedCalendarProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("all")
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(false)

  // Load Google Calendar events
  const loadCalendarEvents = async () => {
    setLoading(true)
    try {
      const today = new Date()
      const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
      
      console.log('正在載入 Google Calendar 事件...')
      const response = await ApiService.getCalendarEvents({
        time_min: today.toISOString(),
        time_max: nextWeek.toISOString(),
        max_results: 50,
      })
      
      console.log('Google Calendar API 響應:', response)
      
      if (response.data && Array.isArray(response.data)) {
        console.log('成功載入 Google Calendar 事件:', response.data.length, '個事件')
        setCalendarEvents(response.data as CalendarEvent[])
      } else if (response.error) {
        // Google Calendar 未授權或回傳錯誤，顯示空的日曆
        console.log('Google Calendar 尚未授權或錯誤，將顯示空的日曆')
        setCalendarEvents([])
      } else {
        console.error('載入 Google Calendar 事件失敗:', response.message)
        setCalendarEvents([])
      }
    } catch (error) {
      console.error('載入 Google Calendar 事件失敗:', error)
      setCalendarEvents([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCalendarEvents()
  }, [])

  const getTimeRange = () => {
    let earliestHour = 7 // Default start at 7 AM
    let latestHour = 22 // Default end at 10 PM

    // Check course schedules
    courses.forEach((course) => {
      course.schedule.forEach((slot) => {
        const startHour = Number.parseInt(slot.startTime.split(":")[0])
        const endHour = Number.parseInt(slot.endTime.split(":")[0])

        if (startHour < earliestHour) {
          earliestHour = startHour
        }
        if (endHour > latestHour) {
          latestHour = endHour
        }
      })
    })

    // Check calendar events
    calendarEvents.forEach((event) => {
      if (event.start.dateTime) {
        const startHour = new Date(event.start.dateTime).getHours()
        const endHour = new Date(event.end.dateTime || event.start.dateTime).getHours()
        
        if (startHour < earliestHour) {
          earliestHour = startHour
        }
        if (endHour > latestHour) {
          latestHour = endHour
        }
      }
    })

    return { earliestHour, latestHour }
  }

  const { earliestHour, latestHour } = getTimeRange()
  const HOURS = Array.from({ length: latestHour - earliestHour + 1 }, (_, i) => i + earliestHour)

  const cycleViewMode = () => {
    setViewMode((current) => {
      switch (current) {
        case "all":
          return "weekdays"
        case "weekdays":
          return "courses"
        case "courses":
          return "all"
        default:
          return "all"
      }
    })
  }

  const getVisibleDays = () => {
    switch (viewMode) {
      case "weekdays":
        return [0, 1, 2, 3, 4] // Monday to Friday
      case "all":
        return [0, 1, 2, 3, 4, 5, 6] // Monday to Sunday
      case "courses":
        // Show only days that have courses or events
        const daysWithContent = new Set<number>()
        courses.forEach((course) => {
          course.schedule.forEach((slot) => {
            daysWithContent.add(slot.dayOfWeek)
          })
        })
        
        // Add days with calendar events
        calendarEvents.forEach((event) => {
          if (event.start.dateTime) {
            const eventDate = new Date(event.start.dateTime)
            const dayOfWeek = (eventDate.getDay() + 6) % 7 // Convert Sunday=0 to Monday=0
            daysWithContent.add(dayOfWeek)
          }
        })
        
        return Array.from(daysWithContent).sort()
      default:
        return [0, 1, 2, 3, 4]
    }
  }

  const visibleDayIndices = getVisibleDays()

  // Create a map of course colors
  const courseColorMap = courses.reduce(
    (acc, course, index) => {
      acc[course.id] = COURSE_COLORS[index % COURSE_COLORS.length]
      return acc
    },
    {} as Record<string, string>,
  )

  const timeToMinutes = (time: string) => {
    const [hours, minutes] = time.split(":").map(Number)
    return hours * 60 + minutes
  }

  const getCourseStyle = (startTime: string, endTime: string) => {
    const startMinutes = timeToMinutes(startTime)
    const endMinutes = timeToMinutes(endTime)

    const startHour = Math.floor(startMinutes / 60) - earliestHour
    const startMinuteInHour = startMinutes % 60
    const durationMinutes = endMinutes - startMinutes

    // Responsive hour height
    const hourHeight = 50 // Optimized for mobile
    const top = startHour * hourHeight + (startMinuteInHour / 60) * hourHeight
    const height = Math.max((durationMinutes / 60) * hourHeight, 25) // Minimum height 25px

    return {
      top: `${top}px`,
      height: `${height}px`,
      zIndex: 10,
    }
  }

  const getEventStyle = (event: CalendarEvent) => {
    if (!event.start.dateTime || !event.end.dateTime) return null

    const startDate = new Date(event.start.dateTime)
    const endDate = new Date(event.end.dateTime)
    
    const startMinutes = startDate.getHours() * 60 + startDate.getMinutes()
    const endMinutes = endDate.getHours() * 60 + endDate.getMinutes()

    const startHour = Math.floor(startMinutes / 60) - earliestHour
    const startMinuteInHour = startMinutes % 60
    const durationMinutes = endMinutes - startMinutes

    // Responsive hour height
    const hourHeight = 50 // Optimized for mobile
    const top = startHour * hourHeight + (startMinuteInHour / 60) * hourHeight
    const height = Math.max((durationMinutes / 60) * hourHeight, 25) // Minimum height 25px

    return {
      top: `${top}px`,
      height: `${height}px`,
      zIndex: 5,
    }
  }

  const getEventsForDay = (dayOfWeek: number) => {
    const today = new Date()
    const startOfWeek = new Date(today.getTime() - (today.getDay() + 6) % 7 * 24 * 60 * 60 * 1000)
    const targetDate = new Date(startOfWeek.getTime() + dayOfWeek * 24 * 60 * 60 * 1000)
    
    return calendarEvents.filter((event) => {
      if (!event.start.dateTime) return false
      const eventDate = new Date(event.start.dateTime)
      return eventDate.toDateString() === targetDate.toDateString()
    })
  }

  return (
    <div className="w-full max-w-full unified-calendar">
      <Card className="p-3 sm:p-4 lg:p-6 overflow-hidden">
        {/* Header with refresh button */}
        <div className="flex justify-between items-center mb-4 gap-3">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <CalendarIcon className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0 text-primary" />
            <h3 className="text-sm sm:text-lg lg:text-xl font-semibold truncate">統一課程與行事曆</h3>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadCalendarEvents}
            disabled={loading}
            className="flex items-center gap-2 text-xs sm:text-sm px-3 py-2 flex-shrink-0"
          >
            <RefreshIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">重新載入</span>
            <span className="sm:hidden">載入</span>
          </Button>
        </div>

        {/* View mode indicator */}
        <div className="mb-3 text-xs sm:text-sm text-muted-foreground text-center bg-muted/50 rounded-lg py-2 px-3">
          <span className="font-medium">
            當前視圖: {viewMode === 'all' ? '全部' : viewMode === 'weekdays' ? '平日' : '有課程'}
          </span>
          <span className="ml-2 text-xs opacity-75">點擊日期標題切換</span>
        </div>

        {/* Calendar container with improved scrolling */}
        <div className="border rounded-lg overflow-hidden bg-background unified-calendar-scroll">
          {/* Day headers */}
          <div className="flex border-b bg-muted/30">
            <div className="w-12 sm:w-16 lg:w-24 flex-shrink-0 border-r bg-muted/50 flex items-center justify-center py-3">
              <span className="text-xs sm:text-sm font-medium text-muted-foreground">時間</span>
            </div>
            {visibleDayIndices.map((dayIndex) => (
              <div
                key={dayIndex}
                className="flex-1 min-w-0 p-2 sm:p-3 text-center font-medium text-sm sm:text-base border-r last:border-r-0 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={cycleViewMode}
              >
                <div className="truncate">
                  <span className="block sm:hidden">{DAYS[dayIndex].slice(-1)}</span>
                  <span className="hidden sm:block lg:hidden">{DAYS[dayIndex].slice(1)}</span>
                  <span className="hidden lg:block">{DAYS[dayIndex]}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="flex overflow-x-auto">
            {/* Time column */}
            <div className="w-12 sm:w-16 lg:w-24 flex-shrink-0 border-r bg-muted/20">
              {HOURS.map((hour) => (
                <div
                  key={hour}
                  className="h-[50px] sm:h-[60px] lg:h-[80px] flex items-start justify-center pt-1 sm:pt-2 text-xs sm:text-sm text-muted-foreground border-b border-border/50"
                >
                  <span className="font-mono">
                    {hour.toString().padStart(2, "0")}
                    <span className="hidden sm:inline">:00</span>
                  </span>
                </div>
              ))}
            </div>

            {/* Days grid */}
            <div className="flex-1 relative min-w-0">
              {/* Hour grid lines */}
              <div className="absolute inset-0 pointer-events-none">
                {HOURS.map((hour, index) => (
                  <div
                    key={hour}
                    className="h-[50px] sm:h-[60px] lg:h-[80px] border-b border-border/30"
                    style={{ top: `${index * 50}px` }}
                  />
                ))}
              </div>

              {/* Day columns */}
              <div className="flex h-full" style={{ height: `${HOURS.length * 50}px` }}>
                {visibleDayIndices.map((dayOfWeek, columnIndex) => {
                  const coursesForDay = courses.filter((course) =>
                    course.schedule.some((slot) => slot.dayOfWeek === dayOfWeek),
                  )
                  const eventsForDay = getEventsForDay(dayOfWeek)

                  return (
                    <div 
                      key={dayOfWeek} 
                      className="flex-1 relative border-r border-border/30 last:border-r-0 min-w-[60px] sm:min-w-[80px] lg:min-w-[120px]"
                    >
                      {/* Render courses */}
                      {coursesForDay.map((course) => {
                        const scheduleSlot = course.schedule.find((slot) => slot.dayOfWeek === dayOfWeek)

                        if (!scheduleSlot) return null

                        const courseStyle = getCourseStyle(scheduleSlot.startTime, scheduleSlot.endTime)

                        return (
                          <div
                            key={`course-${course.id}`}
                            className={`absolute transition-all hover:shadow-md cursor-pointer unified-calendar-item unified-calendar-text-safe ${courseColorMap[course.id]}`}
                            style={{
                              ...courseStyle,
                              left: "2px",
                              right: eventsForDay.length > 0 ? "50%" : "2px",
                            }}
                            onClick={() => onCourseClick(course.id)}
                          >
                            <div className="unified-calendar-title">
                              <div className="truncate" title={course.name}>
                                {course.name}
                              </div>
                            </div>
                            <div className="unified-calendar-subtitle">
                              <div className="truncate" title={course.classroom}>
                                📍 {course.classroom}
                              </div>
                            </div>
                            <div className="text-xs opacity-60 mt-1">
                              {course.source === 'google_classroom' ? '📚 Classroom' : '📝 本地'}
                            </div>
                          </div>
                        )
                      })}

                      {/* Render calendar events */}
                      {eventsForDay.map((event) => {
                        const eventStyle = getEventStyle(event)
                        if (!eventStyle) return null

                        return (
                          <div
                            key={`event-${event.id}`}
                            className="absolute p-1 sm:p-2 m-1 rounded-md border-2 cursor-pointer hover:shadow-md transition-all duration-200 hover:scale-[1.02] bg-amber-50 text-amber-800 border-amber-300 unified-calendar-item unified-calendar-text-safe"
                            style={{
                              ...eventStyle,
                              left: coursesForDay.length > 0 ? "50%" : "2px",
                              right: "2px",
                            }}
                            onClick={() => onEventClick?.(event)}
                          >
                            <div className="unified-calendar-title">
                              <div className="truncate" title={event.summary}>
                                {event.summary}
                              </div>
                            </div>
                            {event.location && (
                              <div className="unified-calendar-subtitle">
                                <div className="truncate" title={event.location}>
                                  📍 {event.location}
                                </div>
                              </div>
                            )}
                            <div className="text-xs opacity-60 mt-1">
                              📅 Calendar
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-4 p-3 bg-muted/30 rounded-lg">
          <div className="flex flex-wrap gap-3 sm:gap-4 text-xs sm:text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-100 border-2 border-blue-300 rounded flex-shrink-0"></div>
              <span>本地課程</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-100 border-2 border-green-300 rounded flex-shrink-0"></div>
              <span>Google Classroom</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-amber-100 border-2 border-amber-300 rounded flex-shrink-0"></div>
              <span>Google Calendar</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

const COURSE_COLORS = [
  "bg-orange-50 text-orange-700 border-orange-300",
  "bg-orange-50 text-orange-700 border-orange-300",
  "bg-orange-50 text-orange-700 border-orange-300",
  "bg-orange-50 text-orange-700 border-orange-300",
  "bg-orange-50 text-orange-700 border-orange-300",
  "bg-indigo-50 text-indigo-700 border-indigo-300",
  "bg-teal-50 text-teal-700 border-teal-300",
  "bg-red-50 text-red-700 border-red-300",
]