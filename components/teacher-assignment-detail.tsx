"use client"

import { useState, useMemo } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { EmptyStateSimple } from "@/components/empty-state"
import { CalendarIcon, ClockIcon, CheckIcon, ExclamationIcon, BellIcon, UserIcon } from "@/components/icons"
import { ExternalLink } from "lucide-react"
import type { Assignment, Course } from "@/types/course"
import { CircularProgress } from "@/components/circular-progress"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface TeacherAssignmentDetailProps {
  assignment: Assignment
  course?: Course
  onBack: () => void
}

// 模擬學生繳交資料
interface StudentSubmission {
  id: string
  name: string
  email: string
  submitted: boolean
  submittedAt?: Date
  grade?: number
  status: "submitted" | "late" | "missing"
}

export function TeacherAssignmentDetail({
  assignment,
  course,
  onBack
}: TeacherAssignmentDetailProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [reminding, setReminding] = useState(false)
  const [statusFilter, setStatusFilter] = useState<"all" | "submitted" | "missing">("all")

  // 模擬學生繳交資料
  const mockStudents: StudentSubmission[] = [
    { id: "1", name: "張小明", email: "ming@example.com", submitted: true, submittedAt: new Date("2024-10-25"), grade: 95, status: "submitted" },
    { id: "2", name: "李小華", email: "hua@example.com", submitted: true, submittedAt: new Date("2024-10-26"), grade: 88, status: "late" },
    { id: "3", name: "王小美", email: "mei@example.com", submitted: false, status: "missing" },
    { id: "4", name: "陳小強", email: "qiang@example.com", submitted: true, submittedAt: new Date("2024-10-24"), grade: 92, status: "submitted" },
    { id: "5", name: "林小芳", email: "fang@example.com", submitted: false, status: "missing" },
  ]

  const filteredStudents = useMemo(() => {
    return mockStudents.filter(student => {
      // 搜尋過濾
      const matchesSearch = searchQuery === "" ||
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.email.toLowerCase().includes(searchQuery.toLowerCase())
      
      // 狀態過濾
      const matchesStatus = 
        statusFilter === "all" ||
        (statusFilter === "submitted" && student.submitted) ||
        (statusFilter === "missing" && !student.submitted)
      
      return matchesSearch && matchesStatus
    })
  }, [searchQuery, statusFilter])

  const submittedCount = mockStudents.filter(s => s.submitted).length
  const totalCount = mockStudents.length
  const submissionRate = Math.round((submittedCount / totalCount) * 100)

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

  const getStatusBadge = (status: StudentSubmission["status"]) => {
    switch (status) {
      case "submitted":
        return <Badge className="bg-green-100 text-green-800">準時繳交</Badge>
      case "late":
        return <Badge className="bg-orange-100 text-orange-800">遲交</Badge>
      case "missing":
        return <Badge variant="destructive">未繳交</Badge>
    }
  }

  const handleRemindAll = async () => {
    setReminding(true)
    // TODO: 實際 API 呼叫
    await new Promise(resolve => setTimeout(resolve, 1000))
    setReminding(false)
    alert("已發送提醒給所有未繳交的學生")
  }

  const isOverdue = new Date(assignment.dueDate) < new Date()

  return (
    <div className="space-y-6">
      {/* 作業基本資訊 */}
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">{assignment.title}</h2>
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            {course && (
              <span className="text-sm px-3 py-1 rounded-full bg-gray-100 text-gray-700 border border-gray-200">
                {course.name}
              </span>
            )}
            {assignment.source === "google_classroom" && (
              <span className="text-sm px-3 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                Google Classroom
              </span>
            )}
          </div>
          {assignment.description && (
            <p className="text-muted-foreground mt-3">{assignment.description}</p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">截止日期：</span>
            <span className={`text-sm ${isOverdue ? 'text-red-600' : 'text-muted-foreground'}`}>
              {formatDate(assignment.dueDate)} {formatTime(assignment.dueDate)}
            </span>
          </div>

          {assignment.googleClassroomUrl && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(assignment.googleClassroomUrl, '_blank')}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              在 Google Classroom 中查看
            </Button>
          )}
        </div>
      </div>

      {/* 繳交統計 */}
      <div className="space-y-4">
        {/* 繳交率進度條 */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">繳交率</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold" style={{ color: "#ff9100" }}>{submissionRate}%</span>
              <span className="text-sm text-muted-foreground">({submittedCount}/{totalCount})</span>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div 
              className="h-full rounded-full transition-all duration-1000 ease-out"
              style={{ 
                width: `${submissionRate}%`,
                backgroundColor: "#ff9100"
              }}
            />
          </div>
        </div>

        {/* 統計卡片 */}
        <div className="grid grid-cols-2 gap-4">
          {/* 已繳交卡片 */}
          <Card 
            className={`p-4 cursor-pointer transition-all ${
              statusFilter === "submitted" 
                ? "border-2 border-green-500 shadow-md" 
                : "hover:shadow-md"
            }`}
            onClick={() => setStatusFilter(statusFilter === "submitted" ? "all" : "submitted")}
          >
            <div className="flex items-center space-x-2">
              <CheckIcon className={`w-5 h-5 transition-colors ${
                statusFilter === "submitted" ? "text-green-600" : "text-gray-400"
              }`} />
              <div>
                <p className={`text-sm transition-colors ${
                  statusFilter === "submitted" ? "text-green-600 font-medium" : "text-muted-foreground"
                }`}>已繳交</p>
                <p className="text-2xl font-bold text-gray-900">{submittedCount}</p>
              </div>
            </div>
          </Card>

          {/* 未繳交卡片 */}
          <Card 
            className={`p-4 cursor-pointer transition-all ${
              statusFilter === "missing" 
                ? "border-2 border-red-500 shadow-md" 
                : "hover:shadow-md"
            }`}
            onClick={() => setStatusFilter(statusFilter === "missing" ? "all" : "missing")}
          >
            <div className="flex items-center space-x-2">
              <ExclamationIcon className={`w-5 h-5 transition-colors ${
                statusFilter === "missing" ? "text-red-600" : "text-gray-400"
              }`} />
              <div>
                <p className={`text-sm transition-colors ${
                  statusFilter === "missing" ? "text-red-600 font-medium" : "text-muted-foreground"
                }`}>未繳交</p>
                <p className="text-2xl font-bold text-gray-900">{totalCount - submittedCount}</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* 學生繳交列表 */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">學生繳交狀態</h3>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" disabled={reminding}>
                <BellIcon className="w-4 h-4 mr-2" />
                提醒未繳交
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>提醒未繳交學生</AlertDialogTitle>
                <AlertDialogDescription>
                  將透過 LINE 推播和 Email 提醒所有尚未繳交「{assignment.title}」的學生。
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>取消</AlertDialogCancel>
                <AlertDialogAction onClick={handleRemindAll}>
                  確認提醒
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <Input
          placeholder="搜尋學生姓名或信箱..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="mb-4"
        />

        {filteredStudents.length > 0 ? (
          <div className="space-y-2">
            {filteredStudents.map((student) => (
              <div
                key={student.id}
                className="relative p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                {/* 手機版佈局 */}
                <div className="flex lg:hidden flex-col gap-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <UserIcon className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground">{student.name}</p>
                        <p className="text-sm text-muted-foreground">{student.email}</p>
                        {student.submitted && student.submittedAt && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {formatDate(student.submittedAt)} {formatTime(student.submittedAt)}
                          </p>
                        )}
                      </div>
                    </div>
                    {student.grade !== undefined && (
                      <div className="text-sm font-medium text-primary ml-2">
                        {student.grade}分
                      </div>
                    )}
                  </div>
                  <div className="flex justify-end">
                    {getStatusBadge(student.status)}
                  </div>
                </div>

                {/* 電腦版佈局 */}
                <div className="hidden lg:flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <UserIcon className="w-5 h-5 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{student.name}</p>
                      <p className="text-sm text-muted-foreground">{student.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {student.submitted && student.submittedAt && (
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">
                          {formatDate(student.submittedAt)} {formatTime(student.submittedAt)}
                        </p>
                        {student.grade !== undefined && (
                          <p className="text-sm font-medium text-primary">
                            分數: {student.grade}
                          </p>
                        )}
                      </div>
                    )}
                    {getStatusBadge(student.status)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyStateSimple
            title="沒有符合條件的學生"
            description="請調整搜尋關鍵字"
            showAction={false}
          />
        )}
      </Card>
    </div>
  )
}
