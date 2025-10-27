"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { EmptyStateSimple } from "@/components/empty-state"
import { CheckIcon, ExclamationIcon, ClockIcon, UserIcon, BookIcon, CalendarIcon, DocumentIcon, BellIcon } from "@/components/icons"
import { Users, MessageCircle } from "lucide-react"
import { useCourses } from "@/hooks/use-courses"
import { ApiService } from "@/services/apiService"
import { CourseForm } from "@/components/course-form"
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

interface TeacherCourseDetailProps {
  courseId: string
  lineUserId: string
  showBackButton?: boolean
  onDeleted?: () => void
  onUpdated?: () => void
  onAssignmentClick?: (assignmentId: string) => void
}

interface CourseStats {
  id: string
  name: string
  code: string
  students_count: number
  bound_groups_count: number
  instructor?: string
  classroom?: string
  schedule?: Array<{
    dayOfWeek: number
    startTime: string
    endTime: string
    location?: string
  }>
}

interface StudentWithBinding {
  id: string
  name: string
  email: string
  line_bound: boolean
  classroom_joined: boolean
  recent_submission_rate?: number
}

interface AssignmentWithMetrics {
  id: string
  title: string
  description?: string
  due_date: string
  submitted_count: number
  total_count: number
  submission_rate: number
  status: 'active' | 'overdue' | 'completed'
}

interface BoundGroup {
  id: string
  name: string
  member_count: number
  bound_at: string
}

interface WeeklyReport {
  week: string
  submission_rate: number
  missing_students: string[]
  total_assignments: number
  completed_assignments: number
}

const DAYS = ["週一", "週二", "週三", "週四", "週五", "週六", "週日"]

export function TeacherCourseDetail({ 
  courseId, 
  lineUserId, 
  showBackButton = true, 
  onDeleted, 
  onUpdated,
  onAssignmentClick
}: TeacherCourseDetailProps) {
  const [activeTab, setActiveTab] = useState("overview")
  const [loading, setLoading] = useState(true)
  const [courseStats, setCourseStats] = useState<CourseStats | null>(null)
  const [students, setStudents] = useState<StudentWithBinding[]>([])
  const [assignments, setAssignments] = useState<AssignmentWithMetrics[]>([])
  const [boundGroups, setBoundGroups] = useState<BoundGroup[]>([])
  const [weeklyReports, setWeeklyReports] = useState<WeeklyReport[]>([])
  
  // 篩選狀態 - 改為多選
  const [studentFilters, setStudentFilters] = useState<Set<string>>(new Set(["line_bound", "line_unbound", "classroom_joined", "classroom_not_joined", "submission_good", "submission_poor"]))
  const [assignmentFilter, setAssignmentFilter] = useState<"all" | "active" | "overdue">("all")
  const [searchQuery, setSearchQuery] = useState("")
  
  // 操作狀態
  const [remindingAssignment, setRemindingAssignment] = useState<string | null>(null)
  const [unbindingGroup, setUnbindingGroup] = useState<string | null>(null)
  const [sendingReport, setSendingReport] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  const { getCourseById, updateCourse, deleteCourse, getAssignmentsByCourse } = useCourses(lineUserId)
  const course = getCourseById(courseId)
  const courseAssignments = getAssignmentsByCourse(courseId)

  // 載入課程統計資料
  const loadCourseStats = async () => {
    try {
      setLoading(true)
      // TODO: 實際 API 呼叫
      // const response = await ApiService.getTeacherCourseDetail({ courseId, lineUserId })
      
      // 模擬資料
      const mockStats: CourseStats = {
        id: courseId,
        name: course?.name || "課程名稱",
        code: course?.courseCode || "COURSE001",
        students_count: 25,
        bound_groups_count: 2,
        instructor: course?.instructor,
        classroom: course?.classroom,
        schedule: course?.schedule
      }
      
      const mockStudents: StudentWithBinding[] = [
        { id: "1", name: "張小明", email: "ming@example.com", line_bound: true, classroom_joined: true, recent_submission_rate: 85 },
        { id: "2", name: "李小華", email: "hua@example.com", line_bound: false, classroom_joined: false, recent_submission_rate: 60 },
        { id: "3", name: "王小美", email: "mei@example.com", line_bound: true, classroom_joined: true, recent_submission_rate: 95 },
      ]
      
      // 使用真實的作業資料，轉換為 AssignmentWithMetrics 格式
      const realAssignments: AssignmentWithMetrics[] = courseAssignments.map(assignment => {
        const now = new Date()
        const dueDate = new Date(assignment.dueDate)
        const isOverdue = dueDate < now
        const isPending = assignment.status === "pending"
        
        return {
          id: assignment.id,
          title: assignment.title,
          description: assignment.description || "",
          due_date: assignment.dueDate.toISOString().split('T')[0],
          submitted_count: Math.floor(Math.random() * 25), // TODO: 從 API 獲取真實資料
          total_count: 25, // TODO: 從 API 獲取真實資料
          submission_rate: Math.floor(Math.random() * 100), // TODO: 從 API 獲取真實資料
          status: isOverdue && !isPending ? "overdue" : isPending ? "active" : "completed"
        }
      })
      
      const mockGroups: BoundGroup[] = [
        { id: "1", name: "資管系一年級", member_count: 15, bound_at: "2024-09-01" },
        { id: "2", name: "資管系二年級", member_count: 10, bound_at: "2024-09-15" }
      ]
      
      const mockReports: WeeklyReport[] = [
        {
          week: "2024-W42",
          submission_rate: 75,
          missing_students: ["李小華", "陳小強"],
          total_assignments: 2,
          completed_assignments: 1
        }
      ]
      
      setCourseStats(mockStats)
      setStudents(mockStudents)
      setAssignments(realAssignments)
      setBoundGroups(mockGroups)
      setWeeklyReports(mockReports)
    } catch (error) {
      console.error('載入課程詳情失敗:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (courseId && lineUserId && course) {
      loadCourseStats()
    }
  }, [courseId, lineUserId, course])

  // 格式化時間
  const formatTime = (time: string) => {
    return time.substring(0, 5)
  }

  // 格式化課程時間
  const formatSchedule = () => {
    if (!course?.schedule || course.schedule.length === 0) {
      return "未設定上課時間"
    }
    return course.schedule.map((slot) => 
      `${DAYS[slot.dayOfWeek]} ${formatTime(slot.startTime)}-${formatTime(slot.endTime)}`
    ).join(", ")
  }

  // 處理提醒未繳作業
  const handleRemindUnsubmitted = async (assignmentId: string) => {
    try {
      setRemindingAssignment(assignmentId)
      // TODO: 實際 API 呼叫
      // await ApiService.remindUnsubmitted({ courseId, assignmentId, lineUserId, channels: ['line', 'email'] })
      console.log('提醒未繳作業:', assignmentId)
      // 模擬延遲
      await new Promise(resolve => setTimeout(resolve, 1000))
    } catch (error) {
      console.error('提醒失敗:', error)
    } finally {
      setRemindingAssignment(null)
    }
  }

  // 處理解除群組綁定
  const handleUnbindGroup = async (groupId: string) => {
    try {
      setUnbindingGroup(groupId)
      // TODO: 實際 API 呼叫
      // await ApiService.unbindGroup({ courseId, groupId, lineUserId })
      console.log('解除群組綁定:', groupId)
      setBoundGroups(prev => prev.filter(g => g.id !== groupId))
    } catch (error) {
      console.error('解除綁定失敗:', error)
    } finally {
      setUnbindingGroup(null)
    }
  }

  // 處理發送週報
  const handleSendWeeklyReport = async (week: string) => {
    try {
      setSendingReport(true)
      // TODO: 實際 API 呼叫
      // await ApiService.sendWeeklyReport({ courseId, week, lineUserId, channels: ['line', 'email'] })
      console.log('發送週報:', week)
      await new Promise(resolve => setTimeout(resolve, 1000))
    } catch (error) {
      console.error('發送週報失敗:', error)
    } finally {
      setSendingReport(false)
    }
  }

  // 篩選學生
  const filteredStudents = students.filter(student => {
    const matchesSearch = searchQuery === "" || 
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase())
    
    // 檢查學生是否符合任一選中的篩選條件
    const matchesLineFilter = 
      (studentFilters.has("line_bound") && student.line_bound) ||
      (studentFilters.has("line_unbound") && !student.line_bound)
    
    const matchesClassroomFilter = 
      (studentFilters.has("classroom_joined") && student.classroom_joined) ||
      (studentFilters.has("classroom_not_joined") && !student.classroom_joined)
    
    const matchesSubmissionFilter = 
      (studentFilters.has("submission_good") && (student.recent_submission_rate || 0) >= 70) ||
      (studentFilters.has("submission_poor") && (student.recent_submission_rate || 0) < 70)
    
    return matchesSearch && matchesLineFilter && matchesClassroomFilter && matchesSubmissionFilter
  })

  // 篩選和排序作業
  const filteredAssignments = assignments
    .filter(assignment => {
      const matchesSearch = searchQuery === "" || 
        assignment.title.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesFilter = assignmentFilter === "all" || assignment.status === assignmentFilter
      
      return matchesSearch && matchesFilter
    })
    .sort((a, b) => {
      const now = new Date()
      const aDueDate = new Date(a.due_date)
      const bDueDate = new Date(b.due_date)
      const aIsActive = a.status === 'active'
      const bIsActive = b.status === 'active'

      // 先按狀態分組：進行中在前，已結束在後
      if (aIsActive !== bIsActive) {
        return aIsActive ? -1 : 1
      }

      // 同狀態內按日期排序
      if (aIsActive) {
        return aDueDate.getTime() - bDueDate.getTime() // 進行中：越早截止的在前
      } else {
        return bDueDate.getTime() - aDueDate.getTime() // 已結束：越晚結束的在前
      }
    })

  if (loading || !course) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">載入課程詳情中...</p>
      </div>
    )
  }

  if (!courseStats) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        <p className="text-sm">無法載入課程資料</p>
      </div>
    )
  }

  const handleCourseUpdate = async (updatedCourse: any) => {
    try {
      await updateCourse(courseId, updatedCourse)
      // 通知父組件刷新數據（這會觸發 useCourses 重新載入）
      if (onUpdated) {
        onUpdated()
      }
      // 等待一小段時間讓 course 對象更新
      await new Promise(resolve => setTimeout(resolve, 100))
      // 重新載入課程統計資料
      await loadCourseStats()
      setIsEditing(false)
    } catch (error) {
      console.error('更新課程失敗:', error)
      alert('更新課程失敗')
    }
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
  }

  if (isEditing && course) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">編輯課程</h1>
        </div>
        <CourseForm initialCourse={course} onSubmit={handleCourseUpdate} onCancel={handleCancelEdit} />
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-24 pb-safe">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{course?.name || courseStats.name}</h1>
          {course?.courseCode && (
            <p className="text-sm text-muted-foreground font-mono mt-1">
              課程代碼: {course.courseCode}
            </p>
          )}
          <div className="mt-2 flex items-center gap-2">
            <span className="text-sm px-3 py-1 rounded-full bg-gray-100 text-gray-700 border border-gray-200">課程</span>
            {course?.source === "google_classroom" && (
              <span className="text-sm px-3 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                Google Classroom
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 課程資訊（對齊管理卡片） */}
      <div className="space-y-4">
        {/* 統計資訊 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            <span className="text-sm text-muted-foreground">
              學生數: <span className="font-medium text-foreground">{courseStats.students_count}</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-green-600" />
            <span className="text-sm text-muted-foreground">
              LINE群組: <span className="font-medium text-foreground">{courseStats.bound_groups_count}</span>
            </span>
          </div>
        </div>

        {/* 上課時間 */}
<div className="flex items-center gap-2">
  <CalendarIcon className="w-4 h-4 text-primary flex-shrink-0" />
  {course.schedule && course.schedule.length > 0 ? (
    <span className="text-sm text-muted-foreground text-balance">
      {formatSchedule()}
    </span>
  ) : (
    <div className="text-xs text-muted-foreground italic">尚未設定上課時間</div>
  )}
</div>

{/* 教室 */}
<div className="flex items-center gap-2">
  <span className="text-sm">📍</span>
  <span className={`text-sm ${course.classroom ? 'text-muted-foreground' : 'text-gray-400 italic'}`}>
    {course.classroom || "尚未設定教室"}
  </span>
</div>
      </div>

      <div className="mb-6">
        <div className="flex bg-muted rounded-lg p-1 overflow-x-auto">
          <Button
            variant={activeTab === "overview" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("overview")}
            className="flex-1 whitespace-nowrap"
          >
            概覽
          </Button>
          <Button
            variant={activeTab === "students" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("students")}
            className="flex-1 whitespace-nowrap"
          >
            學生
          </Button>
          <Button
            variant={activeTab === "assignments" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("assignments")}
            className="flex-1 whitespace-nowrap"
          >
            作業
          </Button>
          <Button
            variant={activeTab === "groups" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("groups")}
            className="flex-1 whitespace-nowrap"
          >
            群組
          </Button>
        </div>
      </div>

      <div className="w-full">
        {activeTab === "overview" && (
        <div className="space-y-6 mt-6">
          {/* 課程統計卡片 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="flex items-center space-x-2">
                <UserIcon className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">學生人數</p>
                  <p className="text-2xl font-bold">{courseStats.students_count}</p>
                </div>
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center space-x-2">
                <BookIcon className="w-5 h-5 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">綁定群組</p>
                  <p className="text-2xl font-bold">{courseStats.bound_groups_count}</p>
                </div>
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center space-x-2">
                <ClockIcon className="w-5 h-5 text-orange-500" />
                <div>
                  <p className="text-sm text-muted-foreground">進行中作業</p>
                  <p className="text-2xl font-bold">{assignments.filter(a => a.status === 'active').length}</p>
                </div>
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center space-x-2">
                <CheckIcon className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm text-muted-foreground">已結束作業</p>
                  <p className="text-2xl font-bold">{assignments.filter(a => a.status === 'overdue').length}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* 課程資訊已移至上方 */}
        </div>
        )}

        {activeTab === "students" && (
        <div className="space-y-4 mt-6">
          {/* 搜尋框 */}
          <Input
            placeholder="搜尋學生姓名或信箱..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          
          {/* 篩選控制 - 卡片方式（可複選） */}
          <div className="space-y-3">
            {/* LINE 綁定狀態 */}
            <div>
              <p className="text-xs text-muted-foreground mb-2">LINE 綁定狀態</p>
              <div className="grid grid-cols-2 gap-3">
                <Card 
                  className={`p-3 cursor-pointer transition-all ${
                    studentFilters.has("line_bound")
                      ? "border-2 border-green-500 shadow-md" 
                      : "hover:shadow-md"
                  }`}
                  onClick={() => {
                    const newFilters = new Set(studentFilters)
                    if (studentFilters.has("line_bound")) {
                      newFilters.delete("line_bound")
                    } else {
                      newFilters.add("line_bound")
                    }
                    setStudentFilters(newFilters)
                  }}
                >
                  <div className="flex items-center space-x-2">
                    <CheckIcon className={`w-4 h-4 transition-colors ${
                      studentFilters.has("line_bound") ? "text-green-600" : "text-gray-400"
                    }`} />
                    <div>
                      <p className={`text-sm transition-colors ${
                        studentFilters.has("line_bound") ? "text-green-600 font-medium" : "text-muted-foreground"
                      }`}>已綁定 LINE</p>
                      <p className="text-lg font-bold text-gray-900">
                        {students.filter(s => s.line_bound).length}
                      </p>
                    </div>
                  </div>
                </Card>

                <Card 
                  className={`p-3 cursor-pointer transition-all ${
                    studentFilters.has("line_unbound")
                      ? "border-2 border-gray-500 shadow-md" 
                      : "hover:shadow-md"
                  }`}
                  onClick={() => {
                    const newFilters = new Set(studentFilters)
                    if (studentFilters.has("line_unbound")) {
                      newFilters.delete("line_unbound")
                    } else {
                      newFilters.add("line_unbound")
                    }
                    setStudentFilters(newFilters)
                  }}
                >
                  <div className="flex items-center space-x-2">
                    <ExclamationIcon className={`w-4 h-4 transition-colors ${
                      studentFilters.has("line_unbound") ? "text-gray-600" : "text-gray-400"
                    }`} />
                    <div>
                      <p className={`text-sm transition-colors ${
                        studentFilters.has("line_unbound") ? "text-gray-600 font-medium" : "text-muted-foreground"
                      }`}>未綁定 LINE</p>
                      <p className="text-lg font-bold text-gray-900">
                        {students.filter(s => !s.line_bound).length}
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>

            {/* Classroom 加入狀態 */}
            <div>
              <p className="text-xs text-muted-foreground mb-2">Classroom 加入狀態</p>
              <div className="grid grid-cols-2 gap-3">
                <Card 
                  className={`p-3 cursor-pointer transition-all ${
                    studentFilters.has("classroom_joined")
                      ? "border-2 border-blue-500 shadow-md" 
                      : "hover:shadow-md"
                  }`}
                  onClick={() => {
                    const newFilters = new Set(studentFilters)
                    if (studentFilters.has("classroom_joined")) {
                      newFilters.delete("classroom_joined")
                    } else {
                      newFilters.add("classroom_joined")
                    }
                    setStudentFilters(newFilters)
                  }}
                >
                  <div className="flex items-center space-x-2">
                    <CheckIcon className={`w-4 h-4 transition-colors ${
                      studentFilters.has("classroom_joined") ? "text-blue-600" : "text-gray-400"
                    }`} />
                    <div>
                      <p className={`text-sm transition-colors ${
                        studentFilters.has("classroom_joined") ? "text-blue-600 font-medium" : "text-muted-foreground"
                      }`}>已加入 Classroom</p>
                      <p className="text-lg font-bold text-gray-900">
                        {students.filter(s => s.classroom_joined).length}
                      </p>
                    </div>
                  </div>
                </Card>

                <Card 
                  className={`p-3 cursor-pointer transition-all ${
                    studentFilters.has("classroom_not_joined")
                      ? "border-2 border-gray-500 shadow-md" 
                      : "hover:shadow-md"
                  }`}
                  onClick={() => {
                    const newFilters = new Set(studentFilters)
                    if (studentFilters.has("classroom_not_joined")) {
                      newFilters.delete("classroom_not_joined")
                    } else {
                      newFilters.add("classroom_not_joined")
                    }
                    setStudentFilters(newFilters)
                  }}
                >
                  <div className="flex items-center space-x-2">
                    <ExclamationIcon className={`w-4 h-4 transition-colors ${
                      studentFilters.has("classroom_not_joined") ? "text-gray-600" : "text-gray-400"
                    }`} />
                    <div>
                      <p className={`text-sm transition-colors ${
                        studentFilters.has("classroom_not_joined") ? "text-gray-600 font-medium" : "text-muted-foreground"
                      }`}>未加入 Classroom</p>
                      <p className="text-lg font-bold text-gray-900">
                        {students.filter(s => !s.classroom_joined).length}
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>

            {/* 繳交率狀態 */}
            <div>
              <p className="text-xs text-muted-foreground mb-2">繳交率狀態</p>
              <div className="grid grid-cols-2 gap-3">
                <Card 
                  className={`p-3 cursor-pointer transition-all ${
                    studentFilters.has("submission_good")
                      ? "border-2 border-orange-500 shadow-md" 
                      : "hover:shadow-md"
                  }`}
                  onClick={() => {
                    const newFilters = new Set(studentFilters)
                    if (studentFilters.has("submission_good")) {
                      newFilters.delete("submission_good")
                    } else {
                      newFilters.add("submission_good")
                    }
                    setStudentFilters(newFilters)
                  }}
                >
                  <div className="flex items-center space-x-2">
                    <CheckIcon className={`w-4 h-4 transition-colors ${
                      studentFilters.has("submission_good") ? "text-orange-600" : "text-gray-400"
                    }`} />
                    <div>
                      <p className={`text-sm transition-colors ${
                        studentFilters.has("submission_good") ? "text-orange-600 font-medium" : "text-muted-foreground"
                      }`}>繳交率良好</p>
                      <p className="text-lg font-bold text-gray-900">
                        {students.filter(s => (s.recent_submission_rate || 0) >= 70).length}
                      </p>
                    </div>
                  </div>
                </Card>

                <Card 
                  className={`p-3 cursor-pointer transition-all ${
                    studentFilters.has("submission_poor")
                      ? "border-2 border-red-500 shadow-md" 
                      : "hover:shadow-md"
                  }`}
                  onClick={() => {
                    const newFilters = new Set(studentFilters)
                    if (studentFilters.has("submission_poor")) {
                      newFilters.delete("submission_poor")
                    } else {
                      newFilters.add("submission_poor")
                    }
                    setStudentFilters(newFilters)
                  }}
                >
                  <div className="flex items-center space-x-2">
                    <ExclamationIcon className={`w-4 h-4 transition-colors ${
                      studentFilters.has("submission_poor") ? "text-red-600" : "text-gray-400"
                    }`} />
                    <div>
                      <p className={`text-sm transition-colors ${
                        studentFilters.has("submission_poor") ? "text-red-600 font-medium" : "text-muted-foreground"
                      }`}>繳交率偏低</p>
                      <p className="text-lg font-bold text-gray-900">
                        {students.filter(s => (s.recent_submission_rate || 0) < 70).length}
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>

          {/* 學生列表 */}
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-4">
              學生名單 ({filteredStudents.length}/{students.length})
            </h3>
            {filteredStudents.length > 0 ? (
              <div className="space-y-3">
                {filteredStudents.map((student) => (
                  <div key={student.id} className="p-3 border rounded-lg">
                    {/* 手機版布局 */}
                    <div className="md:hidden">
                      <h4 className="font-medium mb-1">{student.name}</h4>
                      <p className="text-sm text-muted-foreground mb-2">{student.email}</p>
                      <div className="flex items-center gap-1 flex-wrap">
                        {student.recent_submission_rate !== undefined && (
                          <Badge 
                            variant="outline"
                            className={student.recent_submission_rate >= 70 
                              ? "bg-gradient-to-r from-orange-50 to-orange-100 text-orange-700 border-0 text-xs" 
                              : "bg-gradient-to-r from-red-50 to-red-100 text-red-700 border-0 text-xs"
                            }
                          >
                            繳交率 {student.recent_submission_rate}%
                          </Badge>
                        )}
                        <Badge 
                          variant="outline" 
                          className={student.line_bound 
                            ? "bg-gradient-to-r from-green-50 to-green-100 text-green-700 border-0 text-xs" 
                            : "bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 border-0 text-xs"
                          }
                        >
                          {student.line_bound ? "LINE 已綁定" : "未綁定"}
                        </Badge>
                        <Badge 
                          variant="outline" 
                          className={student.classroom_joined 
                            ? "bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border-0 text-xs" 
                            : "bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 border-0 text-xs"
                          }
                        >
                          {student.classroom_joined ? "已加入 Classroom" : "未加入"}
                        </Badge>
                      </div>
                    </div>
                    
                    {/* 電腦版布局 */}
                    <div className="hidden md:flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium">{student.name}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{student.email}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {student.recent_submission_rate !== undefined && (
                          <Badge 
                            variant="outline"
                            className={student.recent_submission_rate >= 70 
                              ? "bg-gradient-to-r from-orange-50 to-orange-100 text-orange-700 border-0" 
                              : "bg-gradient-to-r from-red-50 to-red-100 text-red-700 border-0"
                            }
                          >
                            繳交率 {student.recent_submission_rate}%
                          </Badge>
                        )}
                        <Badge 
                          variant="outline" 
                          className={student.line_bound 
                            ? "bg-gradient-to-r from-green-50 to-green-100 text-green-700 border-0" 
                            : "bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 border-0"
                          }
                        >
                          {student.line_bound ? "LINE 已綁定" : "未綁定"}
                        </Badge>
                        <Badge 
                          variant="outline" 
                          className={student.classroom_joined 
                            ? "bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border-0" 
                            : "bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 border-0"
                          }
                        >
                          {student.classroom_joined ? "已加入 Classroom" : "未加入"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyStateSimple
                title="沒有符合條件的學生"
                description="請調整篩選條件或搜尋關鍵字"
              />
            )}
          </Card>
        </div>
        )}

        {activeTab === "assignments" && (
        <div className="space-y-4 mt-6">
          {/* 篩選控制 */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Input
              placeholder="搜尋作業標題..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <Select value={assignmentFilter} onValueChange={(value: any) => setAssignmentFilter(value)}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="篩選狀態" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部作業</SelectItem>
                <SelectItem value="active">進行中</SelectItem>
                <SelectItem value="overdue">已逾期</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 作業列表 */}
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-4">
              作業管理 ({filteredAssignments.length}/{assignments.length})
            </h3>
            {filteredAssignments.length > 0 ? (
              <div className="space-y-3">
                {filteredAssignments.map((assignment) => (
                  <div 
                    key={assignment.id} 
                    className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div 
                        className="flex-1 cursor-pointer"
                        onClick={() => onAssignmentClick && onAssignmentClick(assignment.id)}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-medium">{assignment.title}</h4>
                          <Badge variant={assignment.status === 'active' ? "default" : "secondary"}>
                            {assignment.status === 'active' ? '進行中' : '已結束'}
                          </Badge>
                        </div>
                        {/* 手機版：垂直排列test */}
                        <div className="flex flex-col gap-1 text-sm text-muted-foreground md:hidden">
                          <span className="whitespace-nowrap">截止: {assignment.due_date}</span>
                          <span className="whitespace-nowrap">繳交率: {assignment.submission_rate}% ({assignment.submitted_count}/{assignment.total_count})</span>
                        </div>
                        {/* 電腦版：水平排列 */}
                        <div className="hidden md:flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="whitespace-nowrap">截止: {assignment.due_date}</span>
                          <span className="whitespace-nowrap">繳交率: {assignment.submission_rate}% ({assignment.submitted_count}/{assignment.total_count})</span>
                        </div>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              disabled={remindingAssignment === assignment.id}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <BellIcon className="w-4 h-4 mr-1" />
                              <span className="hidden sm:inline">提醒未繳</span>
                              <span className="sm:hidden">提醒</span>
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>提醒未繳交學生</AlertDialogTitle>
                              <AlertDialogDescription>
                                將透過 LINE 推播和 Email 提醒尚未繳交「{assignment.title}」的學生。
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>取消</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleRemindUnsubmitted(assignment.id)}>
                                確認提醒
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyStateSimple
                title="沒有符合條件的作業"
                description="請調整篩選條件或搜尋關鍵字"
              />
            )}
          </Card>
        </div>
        )}

        {activeTab === "groups" && (
        <div className="space-y-4 mt-6">
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-4">
              綁定群組 ({boundGroups.length})
            </h3>
            {boundGroups.length > 0 ? (
              <div className="space-y-3">
                {boundGroups.map((group) => (
                  <div key={group.id} className="flex items-start justify-between p-3 border rounded-lg gap-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium">{group.name}</h4>
                      {/* 手機版和電腦版都垂直排列 */}
                      <div className="flex flex-col gap-1 text-sm text-muted-foreground mt-1">
                        <span className="whitespace-nowrap">成員數: {group.member_count}</span>
                        <span className="whitespace-nowrap">綁定時間: {group.bound_at}</span>
                      </div>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          disabled={unbindingGroup === group.id}
                          className="flex-shrink-0"
                        >
                          解除綁定
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>解除群組綁定</AlertDialogTitle>
                          <AlertDialogDescription>
                            確定要解除與「{group.name}」的綁定嗎？解除後將無法透過此群組接收課程通知。
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>取消</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleUnbindGroup(group.id)}>
                            確認解除
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyStateSimple
                title="尚未綁定任何群組"
                description="請透過 LINE Bot 將課程綁定到群組"
              />
            )}
          </Card>
        </div>
        )}


      </div>
      <div className="flex gap-2">
        <Button variant="outline" className="flex-1 bg-transparent" onClick={() => setIsEditing(true)}>
          編輯
        </Button>
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              className="flex-1 text-destructive hover:text-destructive bg-transparent"
            >
              刪除課程
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>確認刪除課程</AlertDialogTitle>
              <AlertDialogDescription>
                {course?.source === "google_classroom" ? (
                  <>
                    您確定要刪除「{course?.name || courseStats.name}」這門課程嗎？
                    <br />
                    <span className="text-amber-600 font-medium">注意：此課程來自 Google Classroom 同步，刪除後將無法自動重新同步。</span>
                    <br />
                    此操作將同時刪除該課程的所有作業、筆記和考試，且無法復原。
                  </>
                ) : (
                  <>
                    您確定要刪除「{course?.name || courseStats.name}」這門課程嗎？此操作將同時刪除該課程的所有作業、筆記和考試，且無法復原。
                  </>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>取消</AlertDialogCancel>
              <AlertDialogAction
                disabled={deleting}
                onClick={async () => {
                  try {
                    setDeleting(true)
                    await deleteCourse(courseId)
                    setShowDeleteDialog(false)
                    try { (document.activeElement as HTMLElement | null)?.blur?.() } catch { }
                    setTimeout(() => { if (onDeleted) onDeleted() }, 80)
                  } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : '刪除課程時發生未知錯誤'
                    alert(errorMessage)
                    setShowDeleteDialog(false)
                  } finally {
                    setDeleting(false)
                  }
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleting ? '刪除中...' : '確認刪除'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}