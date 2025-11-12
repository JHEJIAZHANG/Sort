"use client"

import { useState, useMemo, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { EmptyStateSimple } from "@/components/empty-state"
import { CalendarIcon, ClockIcon, CheckIcon, ExclamationIcon, BellIcon, UserIcon } from "@/components/icons"
import { ExternalLink } from "lucide-react"
import type { Assignment, Course } from "@/types/course"
import { CircularProgress } from "@/components/circular-progress"
import { ApiService } from "@/services/apiService"
import { Checkbox } from "@/components/ui/checkbox"
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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // 狀態：載入與資料
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [students, setStudents] = useState<StudentSubmission[]>([])
  const [stats, setStats] = useState<{ total: number; submitted: number; unsubmitted: number; rate: number }>({ total: 0, submitted: 0, unsubmitted: 0, rate: 0 })

  // 取得作業繳交統計（教師）
  useEffect(() => {
    let isMounted = true
    const fetchStatus = async () => {
      try {
        setLoading(true)
        setError(null)
        console.log('[TeacherAssignmentDetail] 開始載入作業繳交狀態...', { 
          courseId: assignment.courseId, 
          assignmentId: assignment.id 
        })
        
        const resp = await ApiService.getAssignmentSubmissionStatus(assignment.courseId, assignment.id)
        console.log('[TeacherAssignmentDetail] API 回應:', resp)
        
        const data = (resp as any)?.data || {}
        console.log('[TeacherAssignmentDetail] data:', data)
        
        const results = Array.isArray(data?.results) ? data.results : []
        console.log('[TeacherAssignmentDetail] results:', results)
        
        const first = results[0] || null
        console.log('[TeacherAssignmentDetail] first result:', first)
        
        if (first && first.role === "teacher") {
          const s = first.statistics || {}
          const unSub = Array.isArray(first.unsubmitted_students) ? first.unsubmitted_students : []
          const sub = Array.isArray(first.submitted_students) ? first.submitted_students : []
          
          console.log('[TeacherAssignmentDetail] 統計資料:', s)
          console.log('[TeacherAssignmentDetail] 未繳交學生數:', unSub.length)
          console.log('[TeacherAssignmentDetail] 已繳交學生數:', sub.length)
          
          // 合併已繳交和未繳交學生
          const allStudents: StudentSubmission[] = [
            ...sub.map((u: any, idx: number) => ({
              id: String(u.userId ?? `sub-${idx}`),
              name: u.name ?? "未知學生",
              email: u.emailAddress ?? "",
              submitted: true,
              submittedAt: u.submittedAt ? new Date(u.submittedAt) : undefined,
              status: (u.isLate ? "late" : "submitted") as "submitted" | "late" | "missing"
            })),
            ...unSub.map((u: any, idx: number) => ({
              id: String(u.userId ?? `unsub-${idx}`),
              name: u.name ?? "未知學生",
              email: u.emailAddress ?? "",
              submitted: false,
              status: "missing" as "submitted" | "late" | "missing"
            }))
          ]
          
          console.log('[TeacherAssignmentDetail] 合併後的學生列表:', allStudents)
          
          if (isMounted) {
            setStats({
              total: Number(s.total_students ?? 0),
              submitted: Number(s.submitted ?? 0),
              unsubmitted: Number(s.unsubmitted ?? 0),
              rate: Math.round(Number(s.completion_rate ?? 0))
            })
            setStudents(allStudents)
          }
        } else {
          console.warn('[TeacherAssignmentDetail] 沒有找到教師角色的資料或資料為空')
          if (isMounted) {
            setStats({ total: 0, submitted: 0, unsubmitted: 0, rate: 0 })
            setStudents([])
          }
        }
      } catch (e: any) {
        console.error('[TeacherAssignmentDetail] 載入失敗:', e)
        if (isMounted) setError(e?.message || "載入作業繳交狀態失敗")
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    fetchStatus()
    return () => { isMounted = false }
  }, [assignment.id, assignment.courseId])

  // 切換過濾時清空選取，避免誤選
  useEffect(() => {
    setSelectedIds(new Set())
  }, [statusFilter])

  const toggleSelect = (id: string, checked: boolean) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  const filteredStudents = useMemo(() => {
    return students.filter(student => {
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
  }, [students, searchQuery, statusFilter])

  const submittedCount = stats.submitted
  const totalCount = stats.total
  const submissionRate = stats.rate

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
    try {
      setReminding(true)
      console.log('[Reminder] 開始提醒所有未繳交學生...')
      
      // 先取得未繳交學生名單（以避免後端沒有預設計算時無人被提醒）
      const statusResp = await ApiService.getAssignmentSubmissionStatus(assignment.courseId, assignment.id)
      console.log('[Reminder] 查詢狀態回應:', statusResp)
      
      const statusData = (statusResp as any)?.data || {}
      const results = Array.isArray(statusData?.results) ? statusData.results : []
      const first = results[0] || null
      const unsubmitted = Array.isArray(first?.unsubmitted_students) ? first.unsubmitted_students : []
      
      console.log('[Reminder] 未繳交學生:', unsubmitted)
      
      const targetIds: string[] = unsubmitted
        .map((u: any) => String(u?.userId ?? ''))
        .filter((id: string) => id && id.trim().length > 0)

      console.log('[Reminder] 目標學生 ID:', targetIds)

      if (targetIds.length === 0) {
        console.warn('[Reminder] 沒有未繳交學生')
        alert("目前沒有未繳交學生可提醒")
        return
      }

      console.log('[Reminder] 發送提醒給', targetIds.length, '位學生')
      const resp = await ApiService.sendAssignmentReminder(assignment.courseId, assignment.id, targetIds)
      console.log('[Reminder] sendAssignmentReminder(all) response:', resp)
      const data = (resp as any)?.data

      // 若後端以 200 回傳但內含失敗訊息，給出部分失敗提示
      const emailErrorText = typeof data?.error === 'string' ? data.error : (typeof data?.email_error === 'string' ? data.email_error : '')
      const emailFailed = Boolean(data?.email_error) || (emailErrorText && /email/i.test(emailErrorText))
      const partialFailed = emailFailed || (typeof data?.failed === 'number' && data.failed > 0)
      const explicitFailure = resp?.error || data?.success === false

      if (explicitFailure) {
        throw new Error((resp as any)?.error || emailErrorText || '提醒失敗')
      }

      if (partialFailed) {
        alert('提醒已執行，但部分通知失敗（含 Email）；詳情請查看主控台')
      } else {
        alert("已發送提醒給所有未繳交的學生")
      }
    } catch (error) {
      console.error("[Reminder] 提醒未繳交學生失敗:", error)
      alert("提醒失敗，請稍後重試")
    } finally {
      setReminding(false)
    }
  }

  const handleRemindSelected = async () => {
    try {
      setReminding(true)
      const ids = Array.from(selectedIds)
      if (ids.length === 0) {
        alert("請先選擇要提醒的學生")
        return
      }
      const resp = await ApiService.sendAssignmentReminder(assignment.courseId, assignment.id, ids)
      console.log('[Reminder] sendAssignmentReminder(selected) response:', resp)
      const data = (resp as any)?.data
      const emailErrorText = typeof data?.error === 'string' ? data.error : (typeof data?.email_error === 'string' ? data.email_error : '')
      const emailFailed = Boolean(data?.email_error) || (emailErrorText && /email/i.test(emailErrorText))
      const explicitFailure = resp?.error || data?.success === false

      if (explicitFailure) {
        throw new Error((resp as any)?.error || emailErrorText || '提醒失敗')
      }

      if (emailFailed) {
        alert('提醒已執行，但 Email 發送失敗（詳細錯誤已記錄於主控台）')
      } else {
        alert("已發送提醒給選定學生")
      }
    } catch (error) {
      console.error("提醒失敗:", error)
      alert("提醒失敗，請稍後重試")
    } finally {
      setReminding(false)
    }
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
            <p className="text-muted-foreground mt-3 whitespace-pre-wrap">{assignment.description}</p>
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
          <div className="flex items-center gap-2">
            <Button variant="default" size="sm" disabled={reminding || selectedIds.size === 0} onClick={handleRemindSelected}>
              提醒選定學生
            </Button>
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
        </div>

        <Input
          placeholder="搜尋學生姓名或信箱..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="mb-4"
        />

        {loading ? (
          <div className="py-8 flex justify-center"><CircularProgress percentage={0} /></div>
        ) : error ? (
          <EmptyStateSimple title="載入失敗" description={error} showAction={false} />
        ) : filteredStudents.length > 0 ? (
          <div className="space-y-2">
            {filteredStudents.map((student) => (
              <div
                key={student.id}
                className="relative p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                {/* 手機版佈局 */}
                <div className="flex lg:hidden gap-2">
                  <div className="flex items-center gap-2 flex-1 overflow-hidden">
                    <UserIcon className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-1" />
                    <div className="flex-1 overflow-hidden">
                      <p className="font-medium text-foreground truncate">{student.name}</p>
                      <p className="text-sm text-muted-foreground truncate">{student.email}</p>
                      {student.submitted && student.submittedAt && (
                        <p className="text-xs text-muted-foreground mt-1 whitespace-nowrap">
                          繳交時間:{formatDate(student.submittedAt)} {formatTime(student.submittedAt)}
                        </p>
                      )}
                    </div>
                  </div>
                <div className={`flex flex-col items-end gap-2 flex-shrink-0 ${
                    student.grade === undefined ? 'justify-center' : ''
                  }`}>
                  {student.grade !== undefined && (
                    <span className="text-sm font-medium text-primary whitespace-nowrap">
                      {student.grade}分
                    </span>
                  )}
                  {getStatusBadge(student.status)}
                  <Checkbox
                    checked={selectedIds.has(student.id)}
                    disabled={student.submitted}
                    onCheckedChange={(c) => toggleSelect(student.id, Boolean(c))}
                    aria-label="選擇提醒"
                  />
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
                    <Checkbox
                      checked={selectedIds.has(student.id)}
                      disabled={student.submitted}
                      onCheckedChange={(c) => toggleSelect(student.id, Boolean(c))}
                      aria-label="選擇提醒"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyStateSimple
            title="沒有符合條件的學生"
            description={statusFilter === "submitted" ? "目前僅顯示未繳交學生名單" : "請調整搜尋關鍵字"}
            showAction={false}
          />
        )}
      </Card>
    </div>
  )
}
