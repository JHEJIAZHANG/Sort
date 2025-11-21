"use client"

import { useState, useEffect, useRef } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { EmptyStateSimple } from "@/components/empty-state"
import { CheckIcon, ExclamationIcon, ClockIcon, UserIcon, BookIcon, CalendarIcon, DocumentIcon, BellIcon } from "@/components/icons"
import { Users, MessageCircle, ChevronDown } from "lucide-react"
import { useTeacherCourses } from "@/hooks/use-teacher-courses"
import { transformFrontendCourse } from "@/lib/dataTransform"
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

interface CourseMemberStatus {
  id: string
  lineUserId: string
  name: string
  email?: string
  inLineGroup: boolean
  inClassroom: boolean
  lineGroupName?: string
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
  const [memberStatus, setMemberStatus] = useState<CourseMemberStatus[]>([])
  const [memberStatusLoading, setMemberStatusLoading] = useState(false)
  const [memberStatusError, setMemberStatusError] = useState<string | null>(null)
  const [selectedMemberReminderTargets, setSelectedMemberReminderTargets] = useState<Set<string>>(new Set())
  const [sendingClassroomReminder, setSendingClassroomReminder] = useState(false)
  
  // 篩選狀態 - 改為多選（預設未勾選）
  const [studentFilters, setStudentFilters] = useState<Set<string>>(new Set())
  const [assignmentFilter, setAssignmentFilter] = useState<"all" | "active" | "overdue">("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [isFilterOpenDesktop, setIsFilterOpenDesktop] = useState(false)
  const filterRef = useRef<HTMLDivElement>(null)
  const filterRefDesktop = useRef<HTMLDivElement>(null)
  const [showNotificationDialog, setShowNotificationDialog] = useState(false)
  const [sendingNotification, setSendingNotification] = useState(false)
  
  // 操作狀態
  const [remindingAssignment, setRemindingAssignment] = useState<string | null>(null)
  const [unbindingGroup, setUnbindingGroup] = useState<string | null>(null)
  const [sendingReport, setSendingReport] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [refreshingGroupId, setRefreshingGroupId] = useState<string | null>(null)

  const { getCourseById, getAssignmentsByCourse } = useTeacherCourses(lineUserId)
  const course = getCourseById(courseId)
  const courseAssignments = getAssignmentsByCourse(courseId)

  // 載入課程統計資料
  const loadCourseStats = async () => {
    try {
      setLoading(true)
      ApiService.setLineUserId(lineUserId)

      const [detailResp, studentsResp, assignmentsResp, groupsResp, weeklyResp] = await Promise.all([
        ApiService.getTeacherCourseDetail(courseId),
        ApiService.getCourseStudents(courseId),
        ApiService.getCourseAssignments(courseId),
        ApiService.getCourseLineGroups(courseId),
        ApiService.getCourseWeeklyReport(courseId)
      ])

      const detail = (detailResp as any)?.data?.data || (detailResp as any)?.data || {}
      const studentsRaw = (studentsResp as any)?.data?.students || (studentsResp as any)?.data?.data?.students || (studentsResp as any)?.data || []
      
      // 修正群組回應解析：後端回傳 { success: true, groups: [...], total: N }
      const groupsRaw = (
        (groupsResp as any)?.data?.groups ||  // 新格式：{ data: { groups: [...] } }
        (groupsResp as any)?.data?.data?.groups ||  // 舊格式：{ data: { data: { groups: [...] } } }
        (groupsResp as any)?.data?.data ||  // 備用：{ data: { data: [...] } }
        (groupsResp as any)?.data ||  // 最後備用：{ data: [...] }
        []
      )
      
      const assignmentsRaw = (assignmentsResp as any)?.data?.assignments || (assignmentsResp as any)?.data?.data?.assignments || (assignmentsResp as any)?.data || []
      const weeklyRaw = (weeklyResp as any)?.data?.report || (weeklyResp as any)?.data?.data?.report || (weeklyResp as any)?.data || null

      if (process.env.NODE_ENV !== 'production') {
        console.info('[TeacherCourseDetail] groups query', {
          courseId,
          lineUserId,
          rawCount: Array.isArray(groupsRaw) ? groupsRaw.length : 0,
          rawSample: Array.isArray(groupsRaw) ? groupsRaw.slice(0, 2) : groupsRaw
        })
      }

      // 解析學生姓名，處理後端可能回傳物件格式（例如 { fullName, givenName, familyName }）
      const resolveStudentName = (s: any): string => {
        const raw = s?.name ?? s?.display_name ?? s?.username ?? s?.profile?.name ?? s?.fullName
        if (raw && typeof raw === 'object') {
          const full = (raw as any).fullName || (raw as any).name
          if (typeof full === 'string' && full.trim()) return full.trim()
          const family = (raw as any).familyName || (raw as any).family_name
          const given = (raw as any).givenName || (raw as any).given_name
          const combined = `${family || ''}${given || ''}`.trim()
          if (combined) return combined
        }
        const str = String(raw || '').trim()
        if (str) return str
        const email = s?.email || s?.mail || s?.emailAddress || ''
        if (typeof email === 'string' && email.includes('@')) return email.split('@')[0]
        return '未知'
      }

      // 判定是否已加入 Google Classroom：
      // 1) 後端若明確給了 classroom_joined / joined_classroom，使用該值
      // 2) 若資料形態明顯來自 Google Classroom（有 userId / emailAddress / name 物件），視為課程名單成員 => 已加入
      // 3) 若存在 courseRole（包含 student 字樣）或 enrollmentTime，也視為已加入
      const resolveClassroomJoined = (s: any): boolean => {
        // 優先使用後端明確提供的值
        const explicit = s?.classroom_joined ?? s?.joined_classroom ?? s?.is_classroom_joined
        if (typeof explicit === 'boolean') return explicit
        
        // 如果有 Google Classroom 的 userId，表示已加入
        if (s?.userId || s?.user_id) return true
        
        // 如果有 emailAddress（Google Classroom 特有欄位），表示已加入
        if (s?.emailAddress || s?.email_address) return true
        
        // 如果 name 是物件格式（Google Classroom 格式），表示已加入
        if (s?.name && typeof s?.name === 'object' && (s.name.fullName || s.name.givenName)) return true
        
        // 檢查角色
        const role = s?.courseRole || s?.role || s?.course_role
        if (typeof role === 'string' && role.toLowerCase().includes('student')) return true
        
        // 檢查註冊時間
        if (s?.enrollmentTime || s?.enrolled_at || s?.enrollment_time) return true
        
        // 預設為未加入
        return false
      }

      const resolveGroupName = (g: any): string => {
        // 優先使用各種可能的名稱欄位
        const raw = g?.name ?? g?.display_name ?? g?.title ?? g?.group_name ?? g?.groupName
        let s = String(raw || '').trim()
        
        // 如果沒有名稱，使用 ID
        if (!s) {
          s = String(g?.groupId ?? g?.id ?? g?.group_id ?? g?.group_id ?? '').trim()
        }
        
        // 嘗試 URL 解碼
        try {
          if (/%[0-9A-Fa-f]{2}/.test(s)) {
            const decoded = decodeURIComponent(s)
            if (decoded && decoded !== s) s = decoded
          }
        } catch (e) {
          console.warn('URL decode failed:', e)
        }
        
        // 嘗試 Base64 解碼（但要小心，不是所有字串都是 Base64）
        try {
          // 只有當字串看起來像 Base64 且長度合理時才嘗試解碼
          if (/^[A-Za-z0-9+/=]+$/.test(s) && s.length % 4 === 0 && s.length > 20) {
            const decoded = typeof atob === 'function' ? atob(s) : s
            // 檢查解碼後的字串是否包含可讀字符
            if (decoded && /[\u4e00-\u9fa5a-zA-Z]/.test(decoded)) {
              s = decoded
            }
          }
        } catch (e) {
          // Base64 解碼失敗，保持原字串
        }
        
        return s || '未知群組'
      }

      const resolvedStudents: StudentWithBinding[] = Array.isArray(studentsRaw) ? studentsRaw.map((s: any) => {
        // 判定 LINE 綁定狀態：優先使用後端明確提供的值
        const lineBound = Boolean(
          s.line_bound ?? 
          s.is_line_bound ?? 
          s.line_linked ?? 
          s.has_line_binding ?? 
          s.lineUserId ?? 
          s.line_user_id ?? 
          false
        )
        
        return {
          id: String(s.id ?? s.student_id ?? s.userId ?? s.user_id ?? s.email ?? Math.random()),
          name: resolveStudentName(s),
          email: String(s.email ?? s.mail ?? s.emailAddress ?? s.email_address ?? ''),
          line_bound: lineBound,
          classroom_joined: resolveClassroomJoined(s),
          recent_submission_rate: typeof s.recent_submission_rate === 'number' ? s.recent_submission_rate : undefined
        }
      }) : []

      const resolvedAssignments: AssignmentWithMetrics[] = Array.isArray(assignmentsRaw) ? assignmentsRaw.map((a: any) => {
        const due = a.due_date || a.dueDate || a.deadline
        const dueDateObj = due ? new Date(due) : null
        const now = new Date()
        const status: 'active' | 'overdue' | 'completed' = a.status === 'completed'
          ? 'completed'
          : (dueDateObj && dueDateObj < now ? 'overdue' : 'active')
        return {
          id: String(a.id ?? a.assignment_id ?? Math.random()),
          title: String(a.title ?? '未命名作業'),
          description: a.description ?? '',
          due_date: dueDateObj ? dueDateObj.toISOString().split('T')[0] : '',
          submitted_count: Number(a.submitted_count ?? a.submissions_count ?? 0),
          total_count: Number(a.total_count ?? a.total_students ?? (resolvedStudents.length || 0)),
          submission_rate: Number(a.submission_rate ?? ((a.submitted_count && a.total_count) ? Math.round((a.submitted_count / a.total_count) * 100) : 0)),
          status
        }
      }) : courseAssignments.map(assignment => {
        const now = new Date()
        const dueDate = new Date(assignment.dueDate)
        const isOverdue = dueDate < now
        const isPending = assignment.status === "pending"
        return {
          id: assignment.id,
          title: assignment.title,
          description: assignment.description || "",
          due_date: assignment.dueDate.toISOString().split('T')[0],
          submitted_count: 0,
          total_count: resolvedStudents.length || 0,
          submission_rate: 0,
          // 截止已過且未完成 => overdue；未逾期且未完成 => active；其餘 => completed
          status: assignment.status === "completed" ? "completed" : (isOverdue ? "overdue" : "active")
        }
      })

      const resolvedStats: CourseStats = {
        id: courseId,
        name: course?.name || detail?.name || detail?.title || "課程名稱",
        code: course?.courseCode || detail?.code || detail?.course_code || "",
        students_count: Number(detail?.students_count ?? resolvedStudents.length),
        bound_groups_count: Number(detail?.bound_groups_count ?? (Array.isArray(groupsRaw) ? groupsRaw.length : 0)),
        instructor: course?.instructor || detail?.instructor,
        classroom: course?.classroom || detail?.classroom,
        schedule: course?.schedule || detail?.schedule || []
      }

      const resolvedGroups: BoundGroup[] = Array.isArray(groupsRaw) ? groupsRaw.map((g: any) => {
        // 解析成員數量，支援多種可能的欄位名稱
        const memberCount = Number(
          g.member_count ?? 
          g.members ?? 
          g.memberCount ?? 
          g.members_count ?? 
          g.membersCount ?? 
          0
        )
        
        // 解析綁定時間
        const boundAt = String(
          g.boundAt ?? 
          g.bound_at ?? 
          g.created_at ?? 
          g.createdAt ?? 
          g.bind_time ?? 
          g.bindTime ?? 
          ''
        )
        
        return {
          id: String(g.groupId ?? g.id ?? g.group_id ?? g.lineGroupId ?? Math.random()),
          name: resolveGroupName(g),
          member_count: memberCount,
          bound_at: boundAt
        }
      }) : []

      const resolvedWeekly: WeeklyReport[] = weeklyRaw ? [
        {
          week: String(weeklyRaw.week ?? weeklyRaw.week_start ?? ''),
          submission_rate: Number(weeklyRaw.submission_rate ?? 0),
          missing_students: Array.isArray(weeklyRaw.missing_students) ? weeklyRaw.missing_students.map(String) : [],
          total_assignments: Number(weeklyRaw.total_assignments ?? 0),
          completed_assignments: Number(weeklyRaw.completed_assignments ?? 0)
        }
      ] : []

      setCourseStats(resolvedStats)
      setStudents(resolvedStudents)
      setAssignments(resolvedAssignments)
      setBoundGroups(resolvedGroups)
      setWeeklyReports(resolvedWeekly)

      try {
        await (async () => {
          const ids = resolvedAssignments.map(a => a.id).filter(Boolean)
          if (ids.length === 0) return
          ApiService.setLineUserId(lineUserId)
          const resp = await ApiService.getAssignmentsSubmissionStatus(courseId, ids)
          const data = (resp as any)?.data || {}
          const results = Array.isArray(data?.results) ? data.results : []
          const map: Record<string, any> = {}
          for (const r of results) {
            const key = String(r?.coursework_id ?? r?.assignment_id ?? r?.id ?? '')
            if (key) map[key] = r
          }
          setAssignments(prev => prev.map(a => {
            const r = map[a.id]
            if (!r) return a
            const submitted = Array.isArray(r.submitted_students) ? r.submitted_students.length : Number(r.submitted_count ?? 0)
            const unsubmitted = Array.isArray(r.unsubmitted_students) ? r.unsubmitted_students.length : Number(r.unsubmitted_count ?? 0)
            const total = submitted + unsubmitted || a.total_count
            const rate = total ? Math.round((submitted / total) * 100) : a.submission_rate
            return { ...a, submitted_count: submitted, total_count: total, submission_rate: rate }
          }))
        })()
      } catch {}

    } catch (error) {
      console.error('載入課程詳情失敗:', error)
    } finally {
      setLoading(false)
    }
  }

  const extractMemberList = (response: any): any[] => {
    const candidates = [
      response?.data?.members,
      response?.data?.data?.members,
      response?.data?.line_only_members,
      response?.data?.needs_classroom_reminder,
      response?.data?.member_status,
      response?.data
    ]
    for (const candidate of candidates) {
      if (Array.isArray(candidate) && candidate.length) {
        return candidate
      }
    }
    if (Array.isArray(response)) {
      return response
    }
    return []
  }

  const loadCourseMemberStatus = async () => {
    try {
      setMemberStatusLoading(true)
      setMemberStatusError(null)
      ApiService.setLineUserId(lineUserId)
      const resp = await ApiService.getCourseMemberStatus(courseId)
      const rawMembers = extractMemberList(resp)
      const normalized: CourseMemberStatus[] = Array.isArray(rawMembers)
        ? rawMembers.map((member: any) => {
            const resolvedLineId = String(
              member?.line_user_id ??
              member?.lineUserId ??
              member?.user_id ??
              member?.userId ??
              member?.id ??
              member?.email ??
              ''
            ).trim()

            const resolvedName = (() => {
              if (member?.name) {
                if (typeof member.name === 'string') return member.name
                if (member.name.fullName) return member.name.fullName
                if (member.name.displayName) return member.name.displayName
              }
              if (member?.display_name) return member.display_name
              if (member?.displayName) return member.displayName
              if (member?.user?.displayName) return member.user.displayName
              const email = member?.email ?? member?.emailAddress ?? ''
              if (typeof email === 'string' && email.includes('@')) {
                return email.split('@')[0]
              }
              return resolvedLineId || '未知成員'
            })()

            const resolvedEmail = member?.email ?? member?.emailAddress ?? member?.email_address ?? member?.mail ?? ''
            const inLineGroup = Boolean(
              member?.in_line_group ??
              member?.inLineGroup ??
              member?.line_member ??
              member?.joined_line_group ??
              member?.inLine ??
              true
            )
            const inClassroom = Boolean(
              member?.in_classroom ??
              member?.inClassroom ??
              member?.classroom_joined ??
              member?.joined_classroom ??
              member?.member_in_classroom ??
              member?.classroomStatus
            )

            return {
              id: resolvedLineId || String(member?.id ?? Math.random()),
              lineUserId: resolvedLineId || String(member?.id ?? Math.random()),
              name: resolvedName,
              email: typeof resolvedEmail === 'string' ? resolvedEmail : '',
              inLineGroup,
              inClassroom,
              lineGroupName: member?.line_group_name ?? member?.group_name ?? member?.lineGroupName ?? ''
            }
          })
        : []
      setMemberStatus(normalized)
      setSelectedMemberReminderTargets(new Set())
    } catch (error) {
      console.error('取得課程成員狀態失敗:', error)
      setMemberStatus([])
      setMemberStatusError('無法載入成員資料，請稍後再試')
    } finally {
      setMemberStatusLoading(false)
    }
  }

  const toggleMemberReminderSelection = (memberId: string, checked: boolean) => {
    setSelectedMemberReminderTargets((prev) => {
      const next = new Set(prev)
      if (checked) {
        next.add(memberId)
      } else {
        next.delete(memberId)
      }
      return next
    })
  }

  const handleSendClassroomReminder = async () => {
    if (selectedMemberReminderTargets.size === 0) {
      alert('請先選擇至少一位學生')
      return
    }
    try {
      setSendingClassroomReminder(true)
      const targets = Array.from(selectedMemberReminderTargets)
      await ApiService.sendClassroomReminder(courseId, targets)
      alert('提醒已發送，請通知學生盡快加入 Classroom')
      setSelectedMemberReminderTargets(new Set())
      await loadCourseMemberStatus()
    } catch (error) {
      console.error('發送 Classroom 加入提醒失敗:', error)
      alert('提醒失敗，請稍後再試')
    } finally {
      setSendingClassroomReminder(false)
    }
  }

  const handleRefreshGroupMembers = async (groupId: string) => {
    try {
      setRefreshingGroupId(groupId)
      const resp = await ApiService.refreshLineGroupMembers(courseId, groupId)
      const updatedCountRaw =
        (resp as any)?.data?.member_count ??
        (resp as any)?.data?.data?.member_count ??
        (resp as any)?.data?.members ??
        (resp as any)?.data?.memberCount
      const updatedCount = Number(updatedCountRaw)
      if (!Number.isNaN(updatedCount)) {
        setBoundGroups((prev) =>
          prev.map((group) =>
            group.id === groupId ? { ...group, member_count: updatedCount } : group
          )
        )
      } else {
        await loadCourseStats()
      }
    } catch (error) {
      console.error('重新同步群組成員數失敗:', error)
      alert('重新同步群組成員數失敗，請稍後再試')
    } finally {
      setRefreshingGroupId(null)
    }
  }

  useEffect(() => {
    if (courseId && lineUserId && course) {
      loadCourseStats()
    }
  }, [courseId, lineUserId, course])

  useEffect(() => {
    if (courseId && lineUserId) {
      loadCourseMemberStatus()
    }
  }, [courseId, lineUserId])

  // 點擊外部關閉下拉選單 - 手機版
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // 點擊外部關閉下拉選單 - 電腦版
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRefDesktop.current && !filterRefDesktop.current.contains(event.target as Node)) {
        setIsFilterOpenDesktop(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

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
      console.log('[Reminder] 開始查詢未繳交學生名單...', { courseId, assignmentId })
      
      // 先查詢未繳交學生名單，確保有實際推送對象
      const statusResp = await ApiService.getAssignmentSubmissionStatus(courseId, assignmentId)
      console.log('[Reminder] API 回應:', statusResp)
      
      const statusData = (statusResp as any)?.data || {}
      console.log('[Reminder] statusData:', statusData)
      
      const results = Array.isArray(statusData?.results) ? statusData.results : []
      console.log('[Reminder] results 陣列:', results)
      
      const first = results[0] || null
      console.log('[Reminder] 第一筆結果:', first)
      
      const unsubmitted = Array.isArray(first?.unsubmitted_students) ? first.unsubmitted_students : []
      console.log('[Reminder] 未繳交學生原始資料:', unsubmitted)
      
      const targetIds: string[] = unsubmitted
        .map((u: any) => String(u?.userId ?? ''))
        .filter((id: string) => id && id.trim().length > 0)
      
      console.log('[Reminder] 提取的學生 ID:', targetIds)

      if (targetIds.length === 0) {
        console.warn('[Reminder] 沒有找到未繳交學生')
        alert('目前沒有未繳交學生可提醒')
        return
      }

      console.log('[Reminder] 準備發送提醒給', targetIds.length, '位學生')
      const resp = await ApiService.sendAssignmentReminder(courseId, assignmentId, targetIds)
      console.log('[Reminder] sendAssignmentReminder 回應:', resp)
      
      const data = (resp as any)?.data
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
        alert('已發送提醒給未繳交該作業的學生')
      }
    } catch (error) {
      console.error('[Reminder] 提醒失敗:', error)
      alert('提醒失敗，請稍後重試')
    } finally {
      setRemindingAssignment(null)
    }
  }

  // 處理解除群組綁定
  const handleUnbindGroup = async (groupId: string) => {
    try {
      setUnbindingGroup(groupId)
      const resp = await ApiService.unbindCourseFromLineGroup(courseId, groupId)
      if (resp?.error) {
        throw new Error(resp.error)
      }
      setBoundGroups(prev => prev.filter(g => g.id !== groupId))
    } catch (error) {
      console.error('解除綁定失敗:', error)
      alert('解除群組綁定失敗，請稍後重試')
    } finally {
      setUnbindingGroup(null)
    }
  }

  // 處理發送週報
  const handleSendWeeklyReport = async (week: string) => {
    try {
      setSendingReport(true)
      const resp = await ApiService.sendWeeklyReport(courseId, { week_start: week })
      if (resp?.error) {
        throw new Error(resp.error)
      }
      alert('已發送課程週報')
    } catch (error) {
      console.error('發送週報失敗:', error)
      alert('發送週報失敗，請稍後重試')
    } finally {
      setSendingReport(false)
    }
  }

  // 針對單一群組發送週報
  const handleSendWeeklyReportToGroup = async (groupId: string) => {
    try {
      setSendingReport(true)
      const week = weeklyReports[0]?.week || ''
      const resp = await ApiService.sendWeeklyReport(courseId, { groupId: groupId, week_start: week })
      if ((resp as any)?.error) throw new Error((resp as any).error)
      alert('已發送該群組的週報通知')
    } catch (error) {
      console.error('單群組發送週報失敗:', error)
      alert('發送失敗，請稍後重試')
    } finally {
      setSendingReport(false)
    }
  }

  // 對所有綁定群組群發週報
  const handleSendWeeklyReportAll = async () => {
    try {
      setSendingReport(true)
      const week = weeklyReports[0]?.week || ''
      for (const group of boundGroups) {
        const resp = await ApiService.sendWeeklyReport(courseId, { groupId: group.id, week_start: week })
        if ((resp as any)?.error) throw new Error((resp as any).error)
      }
      alert('已對所有綁定群組發送週報')
    } catch (error) {
      console.error('群發週報失敗:', error)
      alert('群發失敗，請稍後重試')
    } finally {
      setSendingReport(false)
    }
  }

  const lineOnlyMembers = memberStatus.filter(member => member.inLineGroup && !member.inClassroom)
  const lineOnlyIds = lineOnlyMembers.map(member => member.lineUserId || member.id)
  const allLineOnlySelected = lineOnlyMembers.length > 0 && lineOnlyMembers.every(member => selectedMemberReminderTargets.has(member.lineUserId || member.id))

  // 篩選學生
  const filteredStudents = students.filter(student => {
    const matchesSearch = searchQuery === "" || 
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase())
    
    // 如果沒有選擇任何篩選條件，顯示全部學生
    if (studentFilters.size === 0) {
      return matchesSearch
    }
    
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
    
    return matchesSearch && (matchesLineFilter || matchesClassroomFilter || matchesSubmissionFilter)
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
      ApiService.setLineUserId(lineUserId)
      const backendData = transformFrontendCourse(updatedCourse, lineUserId)
      const resp = await ApiService.updateCourse(courseId, backendData)
      if ((resp as any)?.error) throw new Error((resp as any).error)
      if (onUpdated) onUpdated()
      await new Promise(resolve => setTimeout(resolve, 100))
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

          {/* 週報概覽卡片 */}
          {weeklyReports.length > 0 && (
            <Card className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold">本週週報</h3>
                  <div className="mt-2 text-sm text-muted-foreground space-y-1">
                    <div>週期: {weeklyReports[0].week}</div>
                    <div>繳交率: {weeklyReports[0].submission_rate}%</div>
                    <div>總作業數: {weeklyReports[0].total_assignments}</div>
                    <div>已完成作業: {weeklyReports[0].completed_assignments}</div>
                    {weeklyReports[0].missing_students.length > 0 && (
                      <div>未繳學生: {weeklyReports[0].missing_students.join(', ')}</div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Button 
                    variant="default" 
                    size="sm"
                    disabled={sendingReport || boundGroups.length === 0}
                    onClick={handleSendWeeklyReportAll}
                  >
                    {sendingReport ? '發送中...' : '群發週報到所有群組'}
                  </Button>
                  {boundGroups.length === 0 && (
                    <p className="text-xs text-muted-foreground">尚無綁定群組，無法推播週報</p>
                  )}
                </div>
              </div>
            </Card>
          )}

          {/* 課程資訊已移至上方 */}
        </div>
        )}

        {activeTab === "students" && (
        <div className="space-y-4 mt-6">
          <Card className="p-4 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold">LINE 已入群但未加入 Classroom</h3>
                <p className="text-sm text-muted-foreground">
                  {memberStatusLoading
                    ? "正在載入成員資料..."
                    : lineOnlyMembers.length > 0
                      ? `共有 ${lineOnlyMembers.length} 位學生尚未加入 Classroom`
                      : "目前所有 LINE 成員皆已加入 Classroom"}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadCourseMemberStatus}
                  disabled={memberStatusLoading}
                >
                  {memberStatusLoading ? "重新整理中..." : "重新整理"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (allLineOnlySelected) {
                      setSelectedMemberReminderTargets(new Set())
                    } else {
                      setSelectedMemberReminderTargets(new Set(lineOnlyIds))
                    }
                  }}
                  disabled={memberStatusLoading || lineOnlyMembers.length === 0}
                >
                  {allLineOnlySelected ? "取消全選" : "全選"}
                </Button>
              </div>
            </div>
            {memberStatusError && (
              <p className="text-sm text-destructive">{memberStatusError}</p>
            )}
            {memberStatusLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-primary" />
                讀取資料中...
              </div>
            ) : (
              <>
                {lineOnlyMembers.length > 0 ? (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {lineOnlyMembers.map((member) => {
                      const memberId = member.lineUserId || member.id
                      return (
                        <div
                          key={memberId}
                          className="flex items-center justify-between rounded-md border p-3"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <Checkbox
                              id={`reminder-${memberId}`}
                              checked={selectedMemberReminderTargets.has(memberId)}
                              onCheckedChange={(checked) =>
                                toggleMemberReminderSelection(memberId, Boolean(checked))
                              }
                            />
                            <div className="min-w-0">
                              <p className="font-medium truncate">{member.name}</p>
                              <p className="text-xs text-muted-foreground truncate">
                                {member.email || "無信箱資料"}
                              </p>
                              {member.lineGroupName && (
                                <p className="text-xs text-muted-foreground truncate">
                                  群組：{member.lineGroupName}
                                </p>
                              )}
                            </div>
                          </div>
                          <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                            待加入 Classroom
                          </Badge>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    沒有需要提醒的學生。
                  </p>
                )}
              </>
            )}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 border-t">
              <p className="text-sm text-muted-foreground">
                已選擇 {selectedMemberReminderTargets.size} 位學生
              </p>
              <Button
                onClick={handleSendClassroomReminder}
                disabled={
                  memberStatusLoading ||
                  selectedMemberReminderTargets.size === 0 ||
                  sendingClassroomReminder
                }
                className="sm:w-auto"
              >
                {sendingClassroomReminder ? "發送中..." : "提醒加入 Classroom"}
              </Button>
            </div>
          </Card>
          {/* 搜尋框 - 手機版獨立一行 */}
          <div className="sm:hidden">
            <Input
              placeholder="搜尋學生姓名或信箱..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          {/* 篩選控制 - 手機版在搜尋框下方 */}
          <div className="sm:hidden flex gap-2">
            <div className="relative flex-1" ref={filterRef}>
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="w-full flex items-center justify-between px-3 py-2 text-sm border border-input rounded-md bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <span className="text-sm">
                  {studentFilters.size === 0 ? "全部學生" : `已選擇 ${studentFilters.size} 個篩選條件`}
                </span>
                <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} />
              </button>

              {isFilterOpen && (
                <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-md overflow-hidden">
                  <div className="max-h-[300px] overflow-y-auto p-1">
                    <div
                      className="relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
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
                      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                        {studentFilters.has("line_bound") && (
                          <CheckIcon className="h-4 w-4" />
                        )}
                      </span>
                      已綁定 LINE
                    </div>
                    
                    <div
                      className="relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
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
                      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                        {studentFilters.has("line_unbound") && (
                          <CheckIcon className="h-4 w-4" />
                        )}
                      </span>
                      未綁定 LINE
                    </div>
                    
                    <div
                      className="relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
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
                      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                        {studentFilters.has("classroom_joined") && (
                          <CheckIcon className="h-4 w-4" />
                        )}
                      </span>
                      已加入 Classroom
                    </div>
                    
                    <div
                      className="relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
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
                      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                        {studentFilters.has("classroom_not_joined") && (
                          <CheckIcon className="h-4 w-4" />
                        )}
                      </span>
                      未加入 Classroom
                    </div>
                    
                    <div
                      className="relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
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
                      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                        {studentFilters.has("submission_good") && (
                          <CheckIcon className="h-4 w-4" />
                        )}
                      </span>
                      繳交率良好
                    </div>
                    
                    <div
                      className="relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
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
                      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                        {studentFilters.has("submission_poor") && (
                          <CheckIcon className="h-4 w-4" />
                        )}
                      </span>
                      繳交率偏低
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* 清除篩選按鈕 - 手機版 */}
            {studentFilters.size > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStudentFilters(new Set())}
                className="whitespace-nowrap"
              >
                清除篩選
              </Button>
            )}
          </div>
          
          {/* 搜尋框和篩選控制 - 電腦版在同一行 */}
          <div className="hidden sm:flex gap-2">
            <Input
              placeholder="搜尋學生姓名或信箱..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            
            {/* 篩選控制 - 下拉式多選 */}
            <div className="relative w-48" ref={filterRefDesktop}>
              <button
                onClick={() => setIsFilterOpenDesktop(!isFilterOpenDesktop)}
                className="w-full flex items-center justify-between px-3 py-2 text-sm border border-input rounded-md bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <span className="text-sm">
                  {studentFilters.size === 0 ? "全部學生" : `已選擇 ${studentFilters.size} 個篩選條件`}
                </span>
                <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${isFilterOpenDesktop ? 'rotate-180' : ''}`} />
              </button>

              {isFilterOpenDesktop && (
                <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-md overflow-hidden">
                  <div className="max-h-[300px] overflow-y-auto p-1">
                    <div
                      className="relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
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
                      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                        {studentFilters.has("line_bound") && (
                          <CheckIcon className="h-4 w-4" />
                        )}
                      </span>
                      已綁定 LINE
                    </div>
                    
                    <div
                      className="relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
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
                      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                        {studentFilters.has("line_unbound") && (
                          <CheckIcon className="h-4 w-4" />
                        )}
                      </span>
                      未綁定 LINE
                    </div>
                    
                    <div
                      className="relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
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
                      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                        {studentFilters.has("classroom_joined") && (
                          <CheckIcon className="h-4 w-4" />
                        )}
                      </span>
                      Classroom 已加入
                    </div>
                    
                    <div
                      className="relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
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
                      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                        {studentFilters.has("classroom_not_joined") && (
                          <CheckIcon className="h-4 w-4" />
                        )}
                      </span>
                      Classroom 未加入
                    </div>
                    
                    <div
                      className="relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
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
                      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                        {studentFilters.has("submission_good") && (
                          <CheckIcon className="h-4 w-4" />
                        )}
                      </span>
                      繳交率良好
                    </div>
                    
                    <div
                      className="relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
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
                      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                        {studentFilters.has("submission_poor") && (
                          <CheckIcon className="h-4 w-4" />
                        )}
                      </span>
                      繳交率偏低
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* 清除篩選按鈕 - 電腦版 */}
            {studentFilters.size > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStudentFilters(new Set())}
                className="whitespace-nowrap"
              >
                清除篩選
              </Button>
            )}
          </div>

          {/* 學生列表 */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                學生名單 ({filteredStudents.length}/{students.length})
              </h3>
              {studentFilters.size > 0 && filteredStudents.length > 0 && (
                <AlertDialog open={showNotificationDialog} onOpenChange={setShowNotificationDialog}>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="whitespace-nowrap"
                    >
                      <BellIcon className="w-4 h-4 mr-2" />
                      發送通知
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>發送通知給篩選的學生</AlertDialogTitle>
                      <AlertDialogDescription>
                        <div className="space-y-3 mt-2">
                          <p>將向以下 <span className="font-semibold text-foreground">{filteredStudents.length}</span> 位學生發送通知：</p>
                          <div className="space-y-1 text-sm">
                            {studentFilters.has("line_unbound") && (
                              <div className="flex items-start gap-2">
                                <span className="text-orange-600">•</span>
                                <span>提醒尚未綁定 LINE 的學生進行綁定</span>
                              </div>
                            )}
                            {studentFilters.has("classroom_not_joined") && (
                              <div className="flex items-start gap-2">
                                <span className="text-blue-600">•</span>
                                <span>提醒尚未加入 Google Classroom 的學生加入課程</span>
                              </div>
                            )}
                            {studentFilters.has("submission_poor") && (
                              <div className="flex items-start gap-2">
                                <span className="text-red-600">•</span>
                                <span>提醒繳交率偏低的學生注意作業繳交</span>
                              </div>
                            )}
                            {studentFilters.has("line_bound") && !studentFilters.has("line_unbound") && (
                              <div className="flex items-start gap-2">
                                <span className="text-green-600">•</span>
                                <span>向已綁定 LINE 的學生發送通知</span>
                              </div>
                            )}
                            {studentFilters.has("classroom_joined") && !studentFilters.has("classroom_not_joined") && (
                              <div className="flex items-start gap-2">
                                <span className="text-blue-600">•</span>
                                <span>向已加入 Classroom 的學生發送通知</span>
                              </div>
                            )}
                            {studentFilters.has("submission_good") && !studentFilters.has("submission_poor") && (
                              <div className="flex items-start gap-2">
                                <span className="text-orange-600">•</span>
                                <span>向繳交率良好的學生發送通知</span>
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-3">
                            通知將透過 LINE 推播和 Email 發送
                          </p>
                        </div>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>取消</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={async () => {
                          setSendingNotification(true)
                          try {
                            // TODO: 實際 API 呼叫
                            // await ApiService.sendNotificationToStudents({
                            //   courseId,
                            //   studentIds: filteredStudents.map(s => s.id),
                            //   filters: Array.from(studentFilters),
                            //   lineUserId
                            // })
                            console.log('發送通知給學生:', filteredStudents.map(s => s.name))
                            await new Promise(resolve => setTimeout(resolve, 1000))
                            alert('通知已發送！')
                          } catch (error) {
                            console.error('發送通知失敗:', error)
                            alert('發送通知失敗，請稍後再試')
                          } finally {
                            setSendingNotification(false)
                            setShowNotificationDialog(false)
                          }
                        }}
                        disabled={sendingNotification}
                      >
                        {sendingNotification ? '發送中...' : '確認發送'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
            {filteredStudents.length > 0 ? (
              <div className="space-y-3">
                {filteredStudents.map((student) => (
                  <div key={student.id} className="p-3 border rounded-lg">
                    {/* 手機版布局 */}
                    <div className="md:hidden">
                      <h4 className="font-medium mb-1">{student.name}</h4>
                      <p className="text-sm text-muted-foreground mb-2">{student.email}</p>
                      <div className="flex items-center gap-1 flex-wrap">
                        <Badge 
                          variant="outline" 
                          className={student.line_bound 
                            ? "bg-gradient-to-r from-green-50 to-green-100 text-green-700 border-0 text-xs" 
                            : "bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 border-0 text-xs"
                          }
                        >
                          {student.line_bound ? "已綁定 LINE" : "未綁定 LINE"}
                        </Badge>
                        <Badge 
                          variant="outline" 
                          className={student.classroom_joined 
                            ? "bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border-0 text-xs" 
                            : "bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 border-0 text-xs"
                          }
                        >
                          {student.classroom_joined ? "已加入 Classroom" : "未加入 Classroom"}
                        </Badge>
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
                      </div>
                    </div>
                    
                    {/* 電腦版布局 */}
                    <div className="hidden md:block">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium">{student.name}</h4>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant="outline" 
                            className={student.line_bound 
                              ? "bg-gradient-to-r from-green-50 to-green-100 text-green-700 border-0" 
                              : "bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 border-0"
                            }
                          >
                            {student.line_bound ? "已綁定 LINE" : "未綁定 LINE"}
                          </Badge>
                          <Badge 
                            variant="outline" 
                            className={student.classroom_joined 
                              ? "bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border-0" 
                              : "bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 border-0"
                            }
                          >
                            {student.classroom_joined ? "已加入 Classroom" : "未加入 Classroom"}
                          </Badge>
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
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">{student.email}</p>
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
                <SelectItem value="overdue">已結束</SelectItem>
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
                                將透過 LINE 推播和 Email 提醒尚未繳交 「 {assignment.title} 」 的學生。
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
          {typeof window !== 'undefined' && (new URLSearchParams(window.location.search).get('debug') === '1') && (
            <Card className="p-4">
              <h3 className="text-sm font-semibold mb-2">Debug（僅開發用）</h3>
              <div className="text-xs text-muted-foreground space-y-1">
                <div>line_user_id: <span className="font-mono text-foreground">{lineUserId}</span></div>
                <div>course_id: <span className="font-mono text-foreground">{courseId}</span></div>
                <div>綁定群組數（解析後）: <span className="font-mono text-foreground">{boundGroups.length}</span></div>
              </div>
            </Card>
          )}
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
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button 
                        variant="outline" 
                        size="sm"
                        disabled={sendingReport}
                        onClick={() => handleSendWeeklyReportToGroup(group.id)}
                      >
                        {sendingReport ? '發送中...' : '發送週報'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={refreshingGroupId === group.id}
                        onClick={() => handleRefreshGroupMembers(group.id)}
                      >
                        {refreshingGroupId === group.id ? '同步中...' : '重新同步人數'}
                      </Button>
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
                            確定要解除與 「 {group.name} 」 的綁定嗎？解除後將無法透過此群組接收課程通知。
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
                    ApiService.setLineUserId(lineUserId)
                    // 使用教師端專用的刪除 API，傳入課程 ID（可能是整數 ID 或 gc_course_id）
                    const resp = await ApiService.deleteTeacherCourse(courseId)
                    if ((resp as any)?.error) throw new Error((resp as any).error)
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