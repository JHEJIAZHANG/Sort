"use client"

import { useState, useMemo } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { EmptyStateSimple } from "@/components/empty-state"
import { ClipboardIcon, CalendarIcon, CheckIcon, ClockIcon, ExclamationIcon, SearchIcon } from "@/components/icons"
import type { Assignment, Course } from "@/types/course"

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

      return matchesSearch && matchesCourse && matchesStatus
    })
  }, [assignments, searchQuery, filterCourse, filterStatus])

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
      {/* 標題 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">作業管理</h1>
          <p className="text-muted-foreground hidden sm:block">管理所有課程的作業</p>
        </div>
        {/* 手機版搜尋圖示 */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowMobileSearch(!showMobileSearch)}
          className="sm:hidden h-10 w-10"
        >
          <SearchIcon className="w-6 h-6" />
        </Button>
      </div>

      {/* 手機版搜尋框 */}
      {showMobileSearch && (
        <div className="sm:hidden">
          <Input
            placeholder="搜尋作業標題或描述..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>
      )}

      {/* 篩選控制 - 電腦版 */}
      <div className="hidden sm:flex sm:flex-row gap-4">
        <Input
          placeholder="搜尋作業標題或描述..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1"
        />
        <Select value={filterCourse} onValueChange={setFilterCourse}>
          <SelectTrigger className="w-full sm:w-48">
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
          <SelectTrigger className="w-full">
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
