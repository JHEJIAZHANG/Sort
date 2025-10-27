"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import type { Course, Assignment, Exam } from "@/types/course"
import { isSameDayTaiwan, isTodayTaiwan, getTaiwanTime } from "@/lib/taiwan-time"
import { ChevronLeft, ChevronRight, CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

// 滾輪選擇器組件
function ScrollPicker({ 
  value, 
  options, 
  onChange,
  label 
}: { 
  value: number
  options: { value: number; label: string }[]
  onChange: (value: number) => void
  label: string
}) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [isScrolling, setIsScrolling] = useState(false)
  const scrollTimeoutRef = useRef<NodeJS.Timeout>()
  const isInitialMount = useRef(true)
  
  // 初始化滾動位置
  useEffect(() => {
    if (scrollRef.current && isInitialMount.current) {
      const index = options.findIndex(opt => opt.value === value)
      if (index !== -1) {
        const itemHeight = 32
        scrollRef.current.scrollTop = index * itemHeight
      }
      isInitialMount.current = false
    }
  }, [value, options])
  
  const handleScroll = () => {
    setIsScrolling(true)
    
    // 清除之前的計時器
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current)
    }
    
    // 設置新的計時器，在滾動停止後才更新值
    scrollTimeoutRef.current = setTimeout(() => {
      if (scrollRef.current) {
        const itemHeight = 32
        const scrollTop = scrollRef.current.scrollTop
        const index = Math.round(scrollTop / itemHeight)
        if (options[index] && options[index].value !== value) {
          onChange(options[index].value)
        }
      }
      setIsScrolling(false)
    }, 150)
  }
  
  return (
    <div className="flex flex-col items-center">
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="h-32 overflow-y-scroll snap-y snap-mandatory scrollbar-hide relative"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <div className="h-12" />
        {options.map((option) => (
          <div
            key={option.value}
            className={`h-8 flex items-center justify-center snap-center cursor-pointer transition-all ${
              option.value === value 
                ? 'text-foreground font-semibold text-base' 
                : 'text-muted-foreground text-sm'
            }`}
            onClick={() => {
              if (scrollRef.current) {
                const index = options.findIndex(opt => opt.value === option.value)
                const itemHeight = 32
                scrollRef.current.scrollTo({
                  top: index * itemHeight,
                  behavior: 'smooth'
                })
              }
              onChange(option.value)
            }}
          >
            {option.label}
          </div>
        ))}
        <div className="h-12" />
      </div>
    </div>
  )
}

// 自訂日期選擇器組件（使用滾輪選擇器）
function DatePickerCalendar({ selectedDate, onDateSelect }: { selectedDate?: Date; onDateSelect: (date: Date) => void }) {
  const [currentDate, setCurrentDate] = useState(selectedDate || getTaiwanTime())
  const [showYearMonthPicker, setShowYearMonthPicker] = useState(false)
  
  const today = getTaiwanTime()
  const currentMonth = currentDate.getMonth()
  const currentYear = currentDate.getFullYear()
  
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1)
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0)
  const daysInMonth = lastDayOfMonth.getDate()
  
  const taiwanFirstDay = new Date(firstDayOfMonth.getTime() + (8 * 60 * 60 * 1000))
  const startingDayOfWeek = taiwanFirstDay.getUTCDay()
  const adjustedStartDay = startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1
  
  const monthNames = ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"]
  const dayNames = ["一", "二", "三", "四", "五", "六", "日"]
  
  // 生成年份選項（1900-2100）
  const yearOptions = Array.from({ length: 201 }, (_, i) => ({
    value: 1900 + i,
    label: `${1900 + i}年`
  }))
  
  // 生成月份選項
  const monthOptions = monthNames.map((name, index) => ({
    value: index,
    label: name
  }))
  
  const isToday = (day: number) => {
    return today.getDate() === day && today.getMonth() === currentMonth && today.getFullYear() === currentYear
  }
  
  const isSelected = (day: number) => {
    if (!selectedDate) return false
    const selDate = new Date(selectedDate)
    return selDate.getDate() === day && selDate.getMonth() === currentMonth && selDate.getFullYear() === currentYear
  }
  
  // 當 selectedDate 改變時，更新 currentDate 到該月份
  useEffect(() => {
    if (selectedDate) {
      const selDate = new Date(selectedDate)
      setCurrentDate(new Date(selDate.getFullYear(), selDate.getMonth(), 1))
    }
  }, [selectedDate])
  
  const calendarDays = []
  for (let i = 0; i < adjustedStartDay; i++) {
    calendarDays.push(null)
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day)
  }
  
  return (
    <div className="w-full">
      {/* 月份導航 */}
      <div className="flex items-center justify-between mb-3">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setCurrentDate(new Date(currentYear, currentMonth - 1, 1))}
          className="h-8 w-8 p-0"
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowYearMonthPicker(!showYearMonthPicker)}
            className="h-8 px-2 font-medium text-sm hover:bg-accent"
          >
            {currentYear}年 {monthNames[currentMonth]}
          </Button>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setCurrentDate(new Date(currentYear, currentMonth + 1, 1))}
          className="h-8 w-8 p-0"
        >
          <ChevronRightIcon className="h-4 w-4" />
        </Button>
      </div>
      
      {/* 年份月份滾輪選擇器 */}
      {showYearMonthPicker && (
        <div className="mb-3 p-4 border rounded-md bg-background">
          <div className="flex gap-4 justify-center">
            <ScrollPicker
              value={currentYear}
              options={yearOptions}
              onChange={(year) => setCurrentDate(new Date(year, currentMonth, 1))}
              label="年份"
            />
            <ScrollPicker
              value={currentMonth}
              options={monthOptions}
              onChange={(month) => setCurrentDate(new Date(currentYear, month, 1))}
              label="月份"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowYearMonthPicker(false)}
            className="w-full mt-3"
          >
            確定
          </Button>
        </div>
      )}
      
      {/* 星期標題 */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map((day) => (
          <div key={day} className="text-center text-xs font-medium text-muted-foreground py-1">
            {day}
          </div>
        ))}
      </div>
      
      {/* 日期格子 */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, index) => (
          <div
            key={index}
            className={`
              aspect-square flex items-center justify-center text-sm rounded-md p-1 relative min-h-[40px]
              ${day === null ? "" : "hover:bg-accent cursor-pointer transition-colors"}
            `}
            onClick={day ? () => {
              // 使用本地時間創建日期，避免時區問題
              const selectedDate = new Date(currentYear, currentMonth, day, 12, 0, 0)
              onDateSelect(selectedDate)
            } : undefined}
          >
            {day && (
              <span className={`
                flex items-center justify-center font-medium w-7 h-7 rounded-full
                ${isToday(day) ? "bg-primary text-primary-foreground" : ""}
                ${isSelected(day) && !isToday(day) ? "border border-primary text-primary" : ""}
              `}>
                {day}
              </span>
            )}
          </div>
        ))}
      </div>
      
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  )
}

interface ScrollSummaryProps {
  courses: Course[]
  assignments: Assignment[]
  exams: Exam[]
  selectedDate: Date
  onDateChange: (date: Date) => void
  user?: {
    name: string
    isLoggedIn: boolean
  }
}

export function ScrollSummary({ courses, assignments, exams, selectedDate, onDateChange, user }: ScrollSummaryProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [isDragging, setIsDragging] = useState(false)
  const [startY, setStartY] = useState(0)
  const [dragDistance, setDragDistance] = useState(0)
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const isExpandedRef = useRef(true)
  const containerRef = useRef<HTMLDivElement>(null)

  const isToday = () => {
    return isTodayTaiwan(selectedDate)
  }

  // useEffect(() => {
  //   setIsExpanded(isExpandedRef.current)
  // }, [selectedDate])

  const handleClick = (e: React.MouseEvent) => {
    if (!isDragging && e.target === e.currentTarget) {
      const newExpanded = !isExpanded
      setIsExpanded(newExpanded)
      isExpandedRef.current = newExpanded
    }
  }

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      onDateChange(date)
      setIsCalendarOpen(false)
    }
  }

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      setIsDragging(true)
      setStartY(e.clientY)
      setDragDistance(0)
    }

    const handleTouchStart = (e: TouchEvent) => {
      setIsDragging(true)
      setStartY(e.touches[0].clientY)
      setDragDistance(0)
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return

      const currentY = e.clientY
      const distance = currentY - startY
      setDragDistance(distance)

      if (distance > 50 && !isExpanded) {
        const newExpanded = true
        setIsExpanded(newExpanded)
        isExpandedRef.current = newExpanded
      } else if (distance < -30 && isExpanded) {
        const newExpanded = false
        setIsExpanded(newExpanded)
        isExpandedRef.current = newExpanded
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging) return

      const currentY = e.touches[0].clientY
      const distance = currentY - startY
      setDragDistance(distance)

      if (distance > 50 && !isExpanded) {
        const newExpanded = true
        setIsExpanded(newExpanded)
        isExpandedRef.current = newExpanded
      } else if (distance < -30 && isExpanded) {
        const newExpanded = false
        setIsExpanded(newExpanded)
        isExpandedRef.current = newExpanded
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      setDragDistance(0)
    }

    const handleTouchEnd = () => {
      setIsDragging(false)
      setDragDistance(0)
    }

    if (containerRef.current) {
      containerRef.current.addEventListener("mousedown", handleMouseDown)
      containerRef.current.addEventListener("touchstart", handleTouchStart)
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)
    document.addEventListener("touchmove", handleTouchMove)
    document.addEventListener("touchend", handleTouchEnd)

    return () => {
      if (containerRef.current) {
        containerRef.current.removeEventListener("mousedown", handleMouseDown)
        containerRef.current.removeEventListener("touchstart", handleTouchStart)
      }
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
      document.removeEventListener("touchmove", handleTouchMove)
      document.removeEventListener("touchend", handleTouchEnd)
    }
  }, [isDragging, startY, isExpanded])

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return "早安"
    if (hour < 18) return "午安"
    return "晚安"
  }

  const getSelectedDateData = () => {
    // 將 JavaScript 的 getDay() 結果轉換為後端格式
    // JavaScript Date: 0=週日, 1=週一, 2=週二, 3=週三, 4=週四, 5=週五, 6=週六
    // 我們的系統: 0=週一, 1=週二, 2=週三, 3=週四, 4=週五, 5=週六, 6=週日
    const selectedDay = selectedDate.getDay() === 0 ? 6 : selectedDate.getDay() - 1

    const dateCourses = courses.filter((course) => course.schedule.some((slot) => slot.dayOfWeek === selectedDay))

    const dateAssignments = assignments.filter((assignment) => {
      return isSameDayTaiwan(assignment.dueDate, selectedDate) && assignment.status !== "completed"
    })

    const dateExams = exams.filter((exam) => {
      return isSameDayTaiwan(exam.examDate, selectedDate) && exam.status !== "completed"
    })

    let freeTime = ""
    if (dateCourses.length === 0) {
      freeTime = "一整天的空閒時間"
    } else {
      const latestEndTime = dateCourses.reduce((latest, course) => {
        const daySlots = course.schedule.filter((slot) => slot.dayOfWeek === selectedDay)
        const courseLatest = daySlots.reduce((courseMax, slot) => {
          return slot.endTime > courseMax ? slot.endTime : courseMax
        }, "00:00")
        return courseLatest > latest ? courseLatest : latest
      }, "00:00")
      freeTime = `${latestEndTime}後就是您的空閒時間了`
    }

    return {
      courses: dateCourses,
      assignments: dateAssignments,
      exams: dateExams,
      freeTime,
    }
  }

  const selectedDateData = getSelectedDateData()
  const dateStr = selectedDate.getDate().toString().padStart(2, "0")
  const monthStr = selectedDate.toLocaleDateString("zh-TW", { month: "short" })
  const dayStr = selectedDate.toLocaleDateString("zh-TW", { weekday: "long" })

  const goToPreviousDay = () => {
    const previousDay = new Date(selectedDate)
    previousDay.setDate(previousDay.getDate() - 1)
    onDateChange(previousDay)
  }

  const goToNextDay = () => {
    const nextDay = new Date(selectedDate)
    nextDay.setDate(nextDay.getDate() + 1)
    onDateChange(nextDay)
  }

  const goToToday = () => {
    onDateChange(new Date())
  }

  return (
    <div
      ref={containerRef}
      className={`transition-all duration-500 ease-in-out cursor-pointer select-none ${isExpanded ? "mb-6" : "mb-4"}`}
      style={{ transform: isDragging ? `translateY(${Math.min(dragDistance * 0.3, 20)}px)` : undefined }}
      onClick={handleClick}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-baseline gap-3">
          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "text-4xl font-bold text-foreground hover:text-blue-600 transition-colors p-0 h-auto",
                  "hover:bg-transparent focus:bg-transparent"
                )}
                onClick={(e) => e.stopPropagation()}
              >
                {dateStr}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-4" align="start">
              <DatePickerCalendar
                selectedDate={selectedDate}
                onDateSelect={handleDateSelect}
              />
            </PopoverContent>
          </Popover>
          
          <Button
            variant="ghost"
            size="sm"
            className="p-1 h-auto text-muted-foreground hover:text-foreground"
            onClick={(e) => {
              e.stopPropagation()
              setIsCalendarOpen(true)
            }}
          >
            <CalendarIcon className="h-5 w-5" />
          </Button>
        </div>
        <div className="text-right">
          <div className="text-sm text-muted-foreground">{monthStr}</div>
          <div className="text-sm text-muted-foreground">{dayStr}</div>
        </div>
      </div>

      <div
        className={`overflow-hidden transition-all duration-500 ease-in-out ${
          isExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="mb-6 space-y-4">
          <div className="text-muted-foreground">
            <span className="text-xl">{getGreeting()}, </span>
            <span className="text-xl font-medium text-foreground">{user?.isLoggedIn ? user.name : "同學"}</span>
          </div>

          <div className="space-y-3">
            <div className="text-lg text-muted-foreground flex flex-wrap items-center gap-1">
              <span>您{isToday() ? "今天" : "這天"}有</span>
              <span className="text-foreground font-semibold">{selectedDateData.courses.length}</span>
              <span>堂課</span>
              {selectedDateData.assignments.length > 0 && (
                <>
                  <span>、</span>
                  <span className="text-foreground font-semibold">{selectedDateData.assignments.length}</span>
                  <span>個作業</span>
                </>
              )}
              {selectedDateData.exams.length > 0 && (
                <>
                  <span>、</span>
                  <span className="text-foreground font-semibold">{selectedDateData.exams.length}</span>
                  <span>個考試</span>
                </>
              )}
            </div>

            {selectedDateData.courses.length > 0 && (
              <div className="text-base text-muted-foreground">
                分別為 {selectedDateData.courses.map((course) => course.name).join("和")}
              </div>
            )}

            <div className="text-lg text-muted-foreground">
              {isToday() ? "今天" : "這天"}
              {selectedDateData.freeTime === "一整天的空閒時間" ? "您有" : ""}
              {selectedDateData.freeTime === "一整天的空閒時間" ? (
                <span className="text-foreground font-semibold">{selectedDateData.freeTime}</span>
              ) : (
                <>
                  <span className="text-foreground font-semibold">
                    {selectedDateData.freeTime.match(/\d{2}:\d{2}/)?.[0]}
                  </span>
                  <span className="text-foreground font-semibold">
                    {selectedDateData.freeTime.replace(/\d{2}:\d{2}/, "")}
                  </span>
                </>
              )}
              {selectedDateData.freeTime !== "一整天的空閒時間" && "！"}
            </div>
          </div>

          <div className="flex items-center justify-between pt-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                goToPreviousDay()
              }}
              className="p-2 hover:bg-muted"
            >
              <ChevronLeft className="h-4 w-4 text-gray-400" />
            </Button>

            {!isToday() && (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  goToToday()
                }}
                className="px-4 py-1 text-sm"
              >
                今天
              </Button>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                goToNextDay()
              }}
              className="p-2 hover:bg-muted"
            >
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
