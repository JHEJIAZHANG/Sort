"use client"

import { useState, useMemo } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { EmptyStateSimple } from "@/components/empty-state"
import { ClipboardIcon, CalendarIcon, CheckIcon, ClockIcon, ExclamationIcon } from "@/components/icons"
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

  // 篩選作業
  const filteredAssignments = useMemo(() => {
    return assignments.filter((assignment) => {
      const matchesSearch = searchQuery === "" ||
        assignment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (assignment.description && assignment.description.toLowerCase().includes(searchQuery.toLowerCase()))

      const matchesCourse = filterCourse === "all" || assignment.courseId === filterCourse

      const matchesStatus = filterStatus === "all" || assignment.status === filterStatus

      return matchesSearch && matchesCourse && matchesStatus
    })
  }, [assignments, searchQuery, filterCourse, filterStatus])

  // 按狀態分組
  const groupedAssignments = useMemo(() => {
    const groups = {
      overdue: filteredAssignments.filter(a => a.status === "overdue"),
      pending: filteredAssignments.filter(a => a.status === "pending"),
      completed: filteredAssignments.filter(a => a.status === "completed")
    }
    return groups
  }, [filteredAssignments])

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
      <div>
        <h1 className="text-2xl font-bold text-foreground">作業管理</h1>
        <p className="text-muted-foreground">管理所有課程的作業</p>
      </div>

      {/* 篩選控制 */}
      <div className="flex flex-col sm:flex-row gap-4">
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
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="篩選狀態" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部狀態</SelectItem>
            <SelectItem value="pending">進行中</SelectItem>
            <SelectItem value="overdue">已逾期</SelectItem>
            <SelectItem value="completed">已完成</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 統計卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">進行中</p>
              <p className="text-2xl font-bold text-orange-600">{groupedAssignments.pending.length}</p>
            </div>
            <ClockIcon className="w-8 h-8 text-orange-600" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">已逾期</p>
              <p className="text-2xl font-bold text-red-600">{groupedAssignments.overdue.length}</p>
            </div>
            <ExclamationIcon className="w-8 h-8 text-red-600" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">已完成</p>
              <p className="text-2xl font-bold text-green-600">{groupedAssignments.completed.length}</p>
            </div>
            <CheckIcon className="w-8 h-8 text-green-600" />
          </div>
        </Card>
      </div>

      {/* 作業列表 */}
      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-4">
          作業列表 ({filteredAssignments.length})
        </h3>
        {filteredAssignments.length > 0 ? (
          <div className="space-y-3">
            {filteredAssignments.map((assignment) => {
              const course = getCourseById(assignment.courseId)
              const StatusIcon = getStatusIcon(assignment.status)
              
              return (
                <div
                  key={assignment.id}
                  className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
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
                </div>
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
      </Card>
    </div>
  )
}
