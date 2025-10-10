"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AssignmentCard } from "@/components/assignment-card"
import { AssignmentForm } from "@/components/assignment-form"
import { PageHeader } from "@/components/page-header"
import { EmptyState } from "@/components/empty-state"
import { PlusIcon, FilterIcon, GoogleIcon } from "@/components/icons"
import { useCourses } from "@/hooks/use-courses"
import type { Assignment } from "@/types/course"
import { ApiService } from "@/services/apiService"

interface AssignmentManagementProps {
  onBack?: () => void
}

export function AssignmentManagement({ onBack }: AssignmentManagementProps) {
  const lineUserId = ApiService.bootstrapLineUserId()
  const { assignments, courses, addAssignment, updateAssignment, deleteAssignment, getAssignmentById, getCourseById } =
    useCourses(lineUserId)

  const [showForm, setShowForm] = useState(false)
  const [editingAssignment, setEditingAssignment] = useState<string | null>(null)
  const [selectedCourse, setSelectedCourse] = useState<string>("all")
  const [selectedSource, setSelectedSource] = useState<string>("all")
  const [selectedStatus, setSelectedStatus] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")

  // Filter assignments based on selected filters
  const filteredAssignments = assignments.filter((assignment) => {
    const matchesCourse = selectedCourse === "all" || assignment.courseId === selectedCourse
    const matchesSource = selectedSource === "all" || assignment.source === selectedSource
    const matchesStatus = selectedStatus === "all" || assignment.status === selectedStatus
    const matchesSearch =
      searchQuery === "" ||
      assignment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      assignment.description?.toLowerCase().includes(searchQuery.toLowerCase())

    return matchesCourse && matchesSource && matchesStatus && matchesSearch
  })

  // Group assignments by source
  const googleClassroomAssignments = filteredAssignments.filter((a) => a.source === "google_classroom")
  const manualAssignments = filteredAssignments.filter((a) => a.source === "manual")

  const handleStatusChange = (id: string, status: Assignment["status"]) => {
    updateAssignment(id, { status })
  }

  const handleEdit = (id: string) => {
    setEditingAssignment(id)
    setShowForm(true)
  }

  const handleDelete = (id: string) => {
    deleteAssignment(id)
  }

  const handleFormSubmit = (assignmentData: Omit<Assignment, "id">) => {
    if (editingAssignment) {
      updateAssignment(editingAssignment, assignmentData)
    } else {
      addAssignment(assignmentData)
    }
    setShowForm(false)
    setEditingAssignment(null)
  }

  const handleFormCancel = () => {
    setShowForm(false)
    setEditingAssignment(null)
  }

  if (showForm) {
    // 添加調試信息
    const assignmentData = editingAssignment ? getAssignmentById(editingAssignment) : undefined
    console.log('assignment-management editingAssignment:', editingAssignment)
    console.log('assignment-management assignmentData:', assignmentData)
    console.log('assignment-management assignmentData.customReminderTiming:', assignmentData?.customReminderTiming)
    
    return (
      <div>
        <PageHeader title={editingAssignment ? "編輯作業" : "新增作業"} onBack={handleFormCancel} />
        <AssignmentForm
          courses={courses}
          initialData={assignmentData}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title="作業管理" onBack={onBack} />
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <PlusIcon className="w-4 h-4" />
          新增作業
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <FilterIcon className="w-4 h-4" />
            篩選條件
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Input
                placeholder="搜尋作業標題或內容..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <Select value={selectedCourse} onValueChange={setSelectedCourse}>
              <SelectTrigger>
                <SelectValue placeholder="選擇課程" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有課程</SelectItem>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedSource} onValueChange={setSelectedSource}>
              <SelectTrigger>
                <SelectValue placeholder="作業來源" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有來源</SelectItem>
                <SelectItem value="google_classroom">Google Classroom</SelectItem>
                <SelectItem value="manual">手動新增</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder="完成狀態" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有狀態</SelectItem>
                <SelectItem value="pending">進行中</SelectItem>
                <SelectItem value="completed">已完成</SelectItem>
                <SelectItem value="overdue">已逾期</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Card className="p-4">
          <div className="text-2xl font-bold text-primary">{filteredAssignments.length}</div>
          <div className="text-sm text-muted-foreground">總作業數</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-green-600">
            {filteredAssignments.filter((a) => a.status === "completed").length}
          </div>
          <div className="text-sm text-muted-foreground">已完成</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-orange-600">
            {filteredAssignments.filter((a) => a.status === "pending").length}
          </div>
          <div className="text-sm text-muted-foreground">進行中</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-red-600">
            {filteredAssignments.filter((a) => a.status === "overdue").length}
          </div>
          <div className="text-sm text-muted-foreground">已逾期</div>
        </Card>
      </div>

      {/* Google Classroom Assignments */}
      {googleClassroomAssignments.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <GoogleIcon className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold">Google Classroom 作業</h2>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-300">
              {googleClassroomAssignments.length} 項
            </Badge>
          </div>

          <div className="grid gap-4">
            {googleClassroomAssignments.map((assignment) => (
              <AssignmentCard
                key={assignment.id}
                assignment={assignment}
                course={getCourseById(assignment.courseId)}
                onStatusChange={handleStatusChange}
                onEdit={() => handleEdit(assignment.id)}
                onDelete={() => handleDelete(assignment.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Manual Assignments */}
      {manualAssignments.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <PlusIcon className="w-5 h-5 text-green-600" />
            <h2 className="text-lg font-semibold">手動新增作業</h2>
            <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-300">
              {manualAssignments.length} 項
            </Badge>
          </div>

          <div className="grid gap-4">
            {manualAssignments.map((assignment) => (
              <AssignmentCard
                key={assignment.id}
                assignment={assignment}
                course={getCourseById(assignment.courseId)}
                onStatusChange={handleStatusChange}
                onEdit={() => handleEdit(assignment.id)}
                onDelete={() => handleDelete(assignment.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredAssignments.length === 0 && (
        <EmptyState
          type="assignments"
          title={searchQuery || selectedCourse !== "all" || selectedSource !== "all" || selectedStatus !== "all"
            ? "沒有符合篩選條件的作業"
            : undefined}
          onAction={() => setShowForm(true)}
        />
      )}
    </div>
  )
}
