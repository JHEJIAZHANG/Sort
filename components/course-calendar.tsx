"use client"

import { useState } from "react"
import type { Course } from "@/types/course"
import { Card } from "@/components/ui/card"

interface CourseCalendarProps {
  courses: Course[]
  onCourseClick: (courseId: string) => void
}

const DAYS = ["週一", "週二", "週三", "週四", "週五", "週六", "週日"]

type ViewMode = "weekdays" | "all" | "courses"

export function CourseCalendar({ courses, onCourseClick }: CourseCalendarProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("all")

  const getTimeRange = () => {
    let earliestHour = 7 // Default start at 7 AM
    let latestHour = 22 // Default end at 10 PM

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
        // Show only days that have courses
        const daysWithCourses = new Set<number>()
        courses.forEach((course) => {
          course.schedule.forEach((slot) => {
            // Convert dayOfWeek to DAYS array index
            // Backend dayOfWeek: 0=週一, 1=週二, 2=週三, 3=週四, 4=週五, 5=週六, 6=週日
            // DAYS array: 0=週一, 1=週二, 2=週三, 3=週四, 4=週五, 5=週六, 6=週日
            // No conversion needed - they match directly
            daysWithCourses.add(slot.dayOfWeek)
          })
        })
        return Array.from(daysWithCourses).sort()
      default:
        return [0, 1, 2, 3, 4]
    }
  }

  const visibleDayIndices = getVisibleDays()
  const visibleDayOfWeekValues = visibleDayIndices // No conversion needed - already correct dayOfWeek values

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

    const top = startHour * 60 + Math.floor(startMinuteInHour / 5) * 5
    const height = Math.floor(durationMinutes / 5) * 5

    return {
      top: `${top}px`,
      height: `${height}px`,
      zIndex: 10,
    }
  }

  return (
    <Card className="p-2 sm:p-4">
      <div className="w-full">
        {/* Day headers */}
        <div className="flex mb-2">
          <div className="w-12 flex-shrink-0"></div>
          {visibleDayIndices.map((dayIndex) => (
            <div
              key={dayIndex}
              className="flex-1 p-2 text-center font-medium text-xs sm:text-sm rounded bg-gray-50 text-foreground cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={cycleViewMode}
            >
              {DAYS[dayIndex]}
            </div>
          ))}
        </div>

        <div className="flex">
          {/* Left column: Timeline */}
          <div className="w-12 flex-shrink-0 border-r border-gray-200">
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="h-[60px] flex items-start justify-center pt-1 text-xs text-muted-foreground border-b border-gray-100"
              >
                {hour.toString().padStart(2, "0")}:00
              </div>
            ))}
          </div>

          {/* Right column: Course cards area */}
          <div className="flex-1 relative">
            {/* Hour grid lines */}
            {HOURS.map((hour, index) => (
              <div
                key={hour}
                className="h-[60px] border-b border-gray-100"
                style={{ position: "absolute", top: `${index * 60}px`, left: 0, right: 0 }}
              />
            ))}

            {/* Day columns */}
            <div className="flex h-full" style={{ height: `${HOURS.length * 60}px` }}>
              {visibleDayOfWeekValues.map((dayOfWeek, columnIndex) => {
                const coursesForDay = courses.filter((course) =>
                  course.schedule.some((slot) => slot.dayOfWeek === dayOfWeek),
                )

                return (
                  <div key={dayOfWeek} className="flex-1 relative border-r border-gray-100 last:border-r-0">
                    {coursesForDay.map((course) => {
                      const scheduleSlot = course.schedule.find((slot) => slot.dayOfWeek === dayOfWeek)

                      if (!scheduleSlot) return null

                      const courseStyle = getCourseStyle(scheduleSlot.startTime, scheduleSlot.endTime)

                      return (
                        <div
                          key={course.id}
                          className={`absolute p-1 m-0.5 rounded border cursor-pointer hover:shadow-sm transition-shadow ${courseColorMap[course.id]}`}
                          style={{
                            ...courseStyle,
                            left: "2px",
                            right: "2px",
                          }}
                          onClick={() => onCourseClick(course.id)}
                        >
                          <div className="text-xs font-medium leading-tight break-words">{course.name}</div>
                          <div className="text-xs opacity-75 leading-tight break-words">{course.classroom}</div>
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
    </Card>
  )
}

const COURSE_COLORS = [
  "bg-orange-100 text-orange-800 border-orange-200",
  "bg-orange-100 text-orange-800 border-orange-200",
  "bg-orange-100 text-orange-800 border-orange-200",
  "bg-orange-100 text-orange-800 border-orange-200",
  "bg-orange-100 text-orange-800 border-orange-200",
  "bg-orange-100 text-orange-800 border-orange-200",
  "bg-orange-100 text-orange-800 border-orange-200",
  "bg-orange-100 text-orange-800 border-orange-200",
]
