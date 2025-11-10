import { Course, Assignment, Note, Exam } from '@/types/course'
import { 
  createGoogleClassroomCourseUrl,
  createGoogleClassroomAssignmentUrl,
  normalizeGoogleClassroomUrl
} from '@/lib/googleClassroom'

// 安全解析後端回傳的 course 欄位（可能是 UUID 字串或物件）
function extractCourseIdAndName(courseField: any): { id: string; name: string } {
  if (!courseField) return { id: '', name: '' }
  // 物件形式：{ id, name/title }
  if (typeof courseField === 'object') {
    const id = courseField.id != null ? String(courseField.id) : ''
    const name = courseField.name || courseField.title || ''
    return { id, name }
  }
  // 原始型別（字串/數字）
  return { id: String(courseField), name: '' }
}

// 後端 Course 轉換為前端 Course
export function transformBackendCourse(backendCourse: any): Course {
  // 安全檢查：確保 backendCourse 存在
  if (!backendCourse) {
    console.error('transformBackendCourse: 收到無效的課程資料')
    throw new Error('無效的課程資料')
  }

  console.log('🔄 transformBackendCourse 輸入:', backendCourse)

  // 教師API返回的格式：{ id, name, section, schedules, ... }
  const id = String(backendCourse.id || backendCourse.gc_course_id || backendCourse.classroom_id || Date.now())
  const name = backendCourse.name || backendCourse.title || '未命名課程'
  
  // 處理創建時間
  const created = backendCourse.creationTime ? new Date(backendCourse.creationTime) :
                  backendCourse.created_at ? new Date(backendCourse.created_at) : 
                  new Date()

  // 處理課程時間表
  const schedules = (backendCourse.schedules || []).map((schedule: any) => ({
    dayOfWeek: schedule.day_of_week,
    startTime: schedule.start_time,
    endTime: schedule.end_time,
    location: schedule.location || ''
  }))

  // 判斷來源
  const source = backendCourse.is_local || backendCourse.is_google_classroom || backendCourse.enrollmentCode 
    ? 'google_classroom' 
    : 'manual'

  // 計算/修正 Google Classroom 連結
  let googleClassroomUrl: string | undefined = undefined
  if (backendCourse.google_classroom_url) {
    googleClassroomUrl = normalizeGoogleClassroomUrl(backendCourse.google_classroom_url)
  } else {
    const gcId = String(backendCourse.gc_course_id || backendCourse.classroom_id || backendCourse.id || '')
    if (gcId) {
      googleClassroomUrl = createGoogleClassroomCourseUrl(gcId)
    }
  }

  const result: Course = {
    id,
    name,
    courseCode: backendCourse.section || '',
    instructor: backendCourse.ownerId || backendCourse.instructor || '',
    classroom: backendCourse.classroom || backendCourse.location || '',
    studentCount: backendCourse.student_count || 0,
    schedule: schedules,
    color: backendCourse.color || '#3B82F6',
    createdAt: created,
    source: source as 'google_classroom' | 'manual',
    googleClassroomUrl
  }

  console.log('✅ transformBackendCourse 輸出:', result)
  return result
}

// 前端 Course 轉換為後端格式
export function transformFrontendCourse(frontendCourse: Course, lineUserId: string) {
  return {
    title: frontendCourse.name,
    description: frontendCourse.courseCode || '',
    instructor: frontendCourse.instructor || '',
    classroom: frontendCourse.classroom || '',
    color: frontendCourse.color,
    is_google_classroom: frontendCourse.source === 'google_classroom',
    schedules: frontendCourse.schedule.map(schedule => ({
      day_of_week: schedule.dayOfWeek,
      start_time: schedule.startTime,
      end_time: schedule.endTime
    }))
  }
}

// 後端 Homework 轉換為前端 Assignment
export function transformBackendAssignment(backendAssignment: any): Assignment {
  console.log('🔄 transformBackendAssignment 輸入:', backendAssignment)

  // 教師API返回的格式：{ id, title, course_info: { id, name }, due_date, state, ... }
  const courseInfo = backendAssignment.course_info || {}
  const courseId = String(courseInfo.id || backendAssignment.course_id || backendAssignment.course || '')
  const courseName = courseInfo.name || backendAssignment.course_name || ''

  // 處理狀態：state (PUBLISHED, DRAFT) → status (pending, completed, overdue)
  let status: "pending" | "completed" | "overdue" = "pending"
  const backendStatus = backendAssignment.state || backendAssignment.status
  
  if (backendStatus === "COMPLETED" || backendStatus === "completed") {
    status = "completed"
  } else if (backendStatus === "OVERDUE" || backendStatus === "overdue") {
    status = "overdue"
  } else {
    status = "pending"  // PUBLISHED, DRAFT, DELETED 都視為 pending
  }

  // 處理到期日期
  let dueDate = new Date()
  if (backendAssignment.due_datetime) {
    dueDate = new Date(backendAssignment.due_datetime)
  } else if (backendAssignment.due_date) {
    // due_date 可能是 "2025-10-15 23:59" 格式
    dueDate = new Date(backendAssignment.due_date.replace(' ', 'T'))
  }

  // 處理創建和更新時間
  const createdAt = backendAssignment.creation_time ? new Date(backendAssignment.creation_time) :
                    backendAssignment.created_at ? new Date(backendAssignment.created_at) :
                    new Date()
  
  const updatedAt = backendAssignment.update_time ? new Date(backendAssignment.update_time) :
                    backendAssignment.updated_at ? new Date(backendAssignment.updated_at) :
                    new Date()

  // 計算/修正 Google Classroom 作業連結
  let googleClassroomUrl: string | undefined = undefined
  if (backendAssignment.google_classroom_url) {
    googleClassroomUrl = normalizeGoogleClassroomUrl(backendAssignment.google_classroom_url)
  } else if (courseId && backendAssignment.id) {
    googleClassroomUrl = createGoogleClassroomAssignmentUrl(String(courseId), String(backendAssignment.id))
  }

  const result: Assignment = {
    id: String(backendAssignment.id),
    title: backendAssignment.title || '未命名作業',
    description: backendAssignment.description || '',
    dueDate: dueDate,
    courseId: courseId,
    courseName: courseName,
    status: status,
    priority: 'medium',
    createdAt: createdAt,
    updatedAt: updatedAt,
    googleClassroomId: backendAssignment.id || undefined,
    googleClassroomUrl,
    source: 'google_classroom',
    customReminderTiming: backendAssignment.custom_reminder_timing || 'default',
    notificationTime: backendAssignment.notification_time ? new Date(backendAssignment.notification_time) : undefined
  }

  console.log('✅ transformBackendAssignment 輸出:', result)
  return result
}

// 前端 Assignment 轉換為後端格式
export function transformFrontendAssignment(frontendAssignment: Assignment, lineUserId: string) {
  return {
    // 後端從 Header 取得 line user，無需傳 line_user_id
    title: frontendAssignment.title,
    description: frontendAssignment.description || '',
    // 後端 due_date 為 DateTime
    due_date: frontendAssignment.dueDate ? frontendAssignment.dueDate.toISOString() : null,
    // 傳遞計算好的提醒時間
    notification_time: frontendAssignment.notificationTime ? frontendAssignment.notificationTime.toISOString() : null,
    // 後端使用 UUID 字串
    course: frontendAssignment.courseId || null,
    // 與 AssignmentV2 欄位對齊
    type: 'assignment',
    status: frontendAssignment.status || 'pending',
    // 添加自定義提醒時間設定
    custom_reminder_timing: frontendAssignment.customReminderTiming || 'default'
  }
}

// 後端 StudentNote 轉換為前端 Note
export function transformBackendNote(backendNote: any): Note {
  const course = extractCourseIdAndName(backendNote.course)
  return {
    id: backendNote.id.toString(),
    title: backendNote.title,
    content: backendNote.content || '',
    courseId: course.id,
    courseName: backendNote.course_name || course.name || '',
    createdAt: new Date(backendNote.created_at),
    updatedAt: new Date(backendNote.updated_at),
    attachments: backendNote.attachments?.map((attachment: any) => ({
      id: attachment.id.toString(),
      name: attachment.name,
      size: attachment.size,
      type: attachment.type,
      url: attachment.url
    })) || []
  }
}

// 前端 Note 轉換為後端格式
export function transformFrontendNote(frontendNote: Note, lineUserId: string) {
  return {
    // 後端從 Header 取得 line user
    title: frontendNote.title,
    content: frontendNote.content,
    course: frontendNote.courseId || null, // UUID 字串
    tags: frontendNote.tags || [],
    attachment_ids: Array.isArray(frontendNote.attachments)
      ? frontendNote.attachments.map((a: any) => a.id)
      : []
  }
}

// 後端 Exam 轉換為前端 Exam
export function transformBackendExam(backendExam: any): Exam {
  const course = extractCourseIdAndName(backendExam.course)
  return {
    id: backendExam.id.toString(),
    title: backendExam.title,
    description: backendExam.description || '',
    examDate: backendExam.exam_date ? new Date(backendExam.exam_date) : new Date(),
    courseId: course.id,
    courseName: backendExam.course_name || course.name || '',
    location: backendExam.location || '',
    duration: backendExam.duration || 120,
    type: backendExam.type || 'other',
    status: backendExam.status || 'pending',
    createdAt: new Date(backendExam.created_at),
    updatedAt: new Date(backendExam.updated_at)
  }
}

// 前端 Exam 轉換為後端格式
export function transformFrontendExam(frontendExam: Exam, lineUserId: string) {
  return {
    line_user_id: lineUserId,
    title: frontendExam.title,
    description: frontendExam.description,
    exam_date: frontendExam.examDate?.toISOString() || null,
    // 傳遞計算好的提醒時間
    notification_time: frontendExam.notificationTime ? frontendExam.notificationTime.toISOString() : null,
    // 後端使用 UUID，不能 parseInt，直接傳字串
    course: frontendExam.courseId || null,
    location: frontendExam.location,
    duration: frontendExam.duration,
    type: frontendExam.type,
    status: frontendExam.status
  }
}
