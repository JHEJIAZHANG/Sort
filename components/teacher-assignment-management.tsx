"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { EmptyStateSimple } from "@/components/empty-state"
import { ClipboardIcon, CalendarIcon, CheckIcon, ClockIcon, ExclamationIcon, SearchIcon } from "@/components/icons"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import type { Assignment, Course } from "@/types/course"
import { getTaiwanTime } from "@/lib/taiwan-time"

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
  const [isDragging, setIsDragging] = useState(false)
  
  useEffect(() => {
    if (scrollRef.current) {
      const index = options.findIndex(opt => opt.value === value)
      if (index !== -1) {
        const itemHeight = 32
        scrollRef.current.scrollTop = index * itemHeight - itemHeight
      }
    }
  }, [value, options])
  
  const handleScroll = () => {
    if (scrollRef.current && !isDragging) {
      const itemHeight = 32
      const scrollTop = scrollRef.current.scrollTop
      const index = Math.round(scrollTop / itemHeight)
      if (options[index]) {
        onChange(options[index].value)
      }
    }
  }
  
  return (
    <div className="flex flex-col items-center">
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        onMouseDown={() => setIsDragging(true)}
        onMouseUp={() => setIsDragging(false)}
        onTouchStart={() => setIsDragging(true)}
        onTouchEnd={() => setIsDragging(false)}
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
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </div>
        ))}
        <div className="h-12" />
      </div>
    </div>
  )
}

// 簡化的日期選擇器組件（使用滾輪選擇器）
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

interface TeacherAssignmentManagementProps {
  assignments: Assignment[]
  courses: Course[]
  onAssignmentClick: (assignmentId: string) => void
}

export function TeacherAssignmentManagement({
  assignments,
  courses,
  onAssignmentClick
}: TeacherAssignmentManagementProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [filterCourse, setFilterCourse] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [showMobileSearch, setShowMobileSearch] = useState(false)
  const [filterDate, setFilterDate] = useState<string>("")
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showMobileDatePicker, setShowMobileDatePicker] = useState(false)
  const datePickerRef = useRef<HTMLDivElement>(null)

  // 點擊外部關閉日期選擇器
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setShowDatePicker(false)
      }
    }

    if (showDatePicker) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showDatePicker])

  // 篩選作業
  const filteredAssignments = useMemo(() => {
    const now = new Date()
    return assignments.filter((assignment) => {
      const matchesSearch = searchQuery === "" ||
        assignment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (assignment.description && assignment.description.toLowerCase().includes(searchQuery.toLowerCase()))

      const matchesCourse = filterCourse === "all" || assignment.courseId === filterCourse

      const dueDate = new Date(assignment.dueDate)
      const isActive = dueDate >= now || assignment.status === "pending"
      const isEnded = dueDate < now && assignment.status !== "pending"
      
      const matchesStatus = filterStatus === "all" || 
        (filterStatus === "active" && isActive) ||
        (filterStatus === "ended" && isEnded)

      // 日期篩選
      const matchesDate = filterDate === "" || 
        dueDate.toISOString().split('T')[0] === filterDate

      return matchesSearch && matchesCourse && matchesStatus && matchesDate
    })
  }, [assignments, searchQuery, filterCourse, filterStatus, filterDate])

  // 計算各狀態的數量
  const statusCounts = useMemo(() => {
    const now = new Date()
    return {
      all: assignments.length,
      active: assignments.filter(a => {
        const dueDate = new Date(a.dueDate)
        return dueDate >= now || a.status === "pending"
      }).length,
      ended: assignments.filter(a => {
        const dueDate = new Date(a.dueDate)
        return dueDate < now && a.status !== "pending"
      }).length
    }
  }, [assignments])

  const getStatusIcon = (status: Assignment["status"]) => {
    switch (status) {
      case "completed":
        return CheckIcon
      case "overdue":
        return ExclamationIcon
      default:
        return ClockIcon
    }
  }

  const getStatusColor = (status: Assignment["status"]) => {
    switch (status) {
      case "completed":
        return "text-green-600"
      case "overdue":
        return "text-red-600"
      default:
        return "text-orange-600"
    }
  }

  const getStatusText = (status: Assignment["status"]) => {
    switch (status) {
      case "completed":
        return "已完成"
      case "overdue":
        return "已逾期"
      default:
        return "進行中"
    }
  }

  const getCourseById = (courseId: string) => {
    return courses.find(c => c.id === courseId)
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("zh-TW", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    })
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("zh-TW", {
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  return (
    <div className="space-y-6">
      {/* 標題 - 手機版 */}
      <div className="sm:hidden">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">作業管理</h1>
            <p className="text-muted-foreground">管理所有課程的作業</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowMobileSearch(!showMobileSearch)}
            className="h-10 w-10"
          >
            <SearchIcon className="w-6 h-6" />
          </Button>
        </div>
      </div>

      {/* 標題 - 電腦版 */}
      <div className="hidden sm:block mb-6 lg:mb-12 animate-slide-down">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 mobile-spacing">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-foreground leading-tight">作業管理</h1>
            <p className="text-sm sm:text-base lg:text-lg text-muted-foreground mt-2 lg:mt-3">管理所有課程的作業</p>
          </div>
        </div>
      </div>

      {/* 手機版搜尋框 */}
      {showMobileSearch && (
        <div className="sm:hidden flex gap-2">
          <Input
            placeholder="搜尋作業標題或描述..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
          <div className="relative">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowMobileDatePicker(!showMobileDatePicker)}
              className="h-10 w-10"
            >
              <CalendarIcon className="w-5 h-5" />
            </Button>
            {showMobileDatePicker && (
              <div className="absolute top-full right-0 mt-2 z-10 bg-white border border-input rounded-md shadow-lg p-4 w-[320px]">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-sm">選擇日期</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setFilterDate("")
                      setShowMobileDatePicker(false)
                    }}
                    className="text-xs h-7 px-2"
                  >
                    清除
                  </Button>
                </div>
                <DatePickerCalendar
                  selectedDate={filterDate ? new Date(filterDate + 'T12:00:00') : undefined}
                  onDateSelect={(date) => {
                    const year = date.getFullYear()
                    const month = String(date.getMonth() + 1).padStart(2, '0')
                    const day = String(date.getDate()).padStart(2, '0')
                    setFilterDate(`${year}-${month}-${day}`)
                    setShowMobileDatePicker(false)
                  }}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* 篩選控制 - 電腦版 */}
      <div className="hidden sm:flex sm:flex-row gap-4">
        <div className="flex-1 flex gap-2">
          <Input
            placeholder="搜尋作業標題或描述..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
          <div className="relative" ref={datePickerRef}>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="h-10 w-10"
            >
              <CalendarIcon className="w-5 h-5" />
            </Button>
            {showDatePicker && (
              <div className="absolute top-full right-0 mt-2 z-10 bg-white border border-input rounded-md shadow-lg p-4 w-[320px]">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-sm">選擇日期</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setFilterDate("")
                      setShowDatePicker(false)
                    }}
                    className="text-xs h-7 px-2"
                  >
                    清除
                  </Button>
                </div>
                <DatePickerCalendar
                  selectedDate={filterDate ? new Date(filterDate + 'T12:00:00') : undefined}
                  onDateSelect={(date) => {
                    const year = date.getFullYear()
                    const month = String(date.getMonth() + 1).padStart(2, '0')
                    const day = String(date.getDate()).padStart(2, '0')
                    setFilterDate(`${year}-${month}-${day}`)
                    setShowDatePicker(false)
                  }}
                />
              </div>
            )}
          </div>
        </div>
        <div className="w-full sm:w-48">
          <Select value={filterCourse} onValueChange={setFilterCourse}>
            <SelectTrigger className="w-full border border-input">
              <SelectValue placeholder="篩選課程" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部課程</SelectItem>
              {courses.map((course) => (
                <SelectItem key={course.id} value={course.id}>
                  {course.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 手機版篩選控制 - 狀態按鈕在上，課程選擇在下 */}
      <div className="sm:hidden space-y-4">
        {/* 狀態按鈕 */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          <Button
            variant={filterStatus === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterStatus("all")}
            className="whitespace-nowrap"
          >
            全部 ({statusCounts.all})
          </Button>
          <Button
            variant={filterStatus === "active" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterStatus("active")}
            className="whitespace-nowrap"
          >
            進行中 ({statusCounts.active})
          </Button>
          <Button
            variant={filterStatus === "ended" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterStatus("ended")}
            className="whitespace-nowrap"
          >
            已結束 ({statusCounts.ended})
          </Button>
        </div>
        
        {/* 課程篩選 */}
        <Select value={filterCourse} onValueChange={setFilterCourse}>
          <SelectTrigger className="w-full border border-input">
            <SelectValue placeholder="篩選課程" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部課程</SelectItem>
            {courses.map((course) => (
              <SelectItem key={course.id} value={course.id}>
                {course.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 電腦版狀態按鈕 */}
      <div className="hidden sm:flex gap-2 overflow-x-auto pb-2">
        <Button
          variant={filterStatus === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilterStatus("all")}
          className="whitespace-nowrap"
        >
          全部 ({statusCounts.all})
        </Button>
        <Button
          variant={filterStatus === "active" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilterStatus("active")}
          className="whitespace-nowrap"
        >
          進行中 ({statusCounts.active})
        </Button>
        <Button
          variant={filterStatus === "ended" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilterStatus("ended")}
          className="whitespace-nowrap"
        >
          已結束 ({statusCounts.ended})
        </Button>
      </div>

      {/* 作業列表 */}
      {filteredAssignments.length > 0 ? (
        <div className="space-y-3">
          {filteredAssignments.map((assignment) => {
            const course = getCourseById(assignment.courseId)
            const StatusIcon = getStatusIcon(assignment.status)
            
            return (
              <Card
                key={assignment.id}
                className="p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => onAssignmentClick(assignment.id)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <StatusIcon className={`w-5 h-5 ${getStatusColor(assignment.status)}`} />
                      <h4 className="font-medium text-foreground truncate">{assignment.title}</h4>
                      <Badge variant={assignment.status === "overdue" ? "destructive" : "default"}>
                        {getStatusText(assignment.status)}
                      </Badge>
                      {assignment.source === "google_classroom" && (
                        <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                          Google Classroom
                        </span>
                      )}
                    </div>
                    
                    {assignment.description && (
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                        {assignment.description}
                      </p>
                    )}
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      {course && (
                        <div className="flex items-center gap-1">
                          <ClipboardIcon className="w-4 h-4" />
                          <span>{course.name}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <CalendarIcon className="w-4 h-4" />
                        <span>截止: {formatDate(assignment.dueDate)} {formatTime(assignment.dueDate)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      ) : (
        <EmptyStateSimple
          title="沒有符合條件的作業"
          description="請調整篩選條件或搜尋關鍵字"
          showAction={false}
        />
      )}
    </div>
  )
}
