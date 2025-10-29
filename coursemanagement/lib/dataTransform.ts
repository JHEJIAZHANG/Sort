import { Course, Assignment, Note, Exam } from '@/types/course'

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

  // 嘗試多種可能的 ID 欄位（教師API返回的是 Google Classroom ID）
  const rawId = backendCourse?.id ?? backendCourse?.pk ?? backendCourse?.uuid ?? backendCourse?.course_id ?? backendCourse?.classroom_id
  const fallbackId = (typeof crypto !== 'undefined' && (crypto as any).randomUUID) ? (crypto as any).randomUUID() : String(Date.now())
  const id = rawId != null ? String(rawId) : fallbackId

  // 處理創建時間（教師API返回的是 creationTime）
  const created = backendCourse?.created_at ? new Date(backendCourse.created_at) : 
                  backendCourse?.creationTime ? new Date(backendCourse.creationTime) : 
                  new Date()

  // 課程名稱：優先使用 name，其次 title
  const courseName = backendCourse.name || backendCourse.title || ''
  
  // 判斷是否為 Google Classroom 課程
  // 教師API返回的課程都是 Google Classroom 課程
  const isGoogleClassroom = backendCourse.is_google_classroom || 
                           backendCourse.source === 'google_classroom' ||
                           !!backendCourse.classroom_id ||
                           !!backendCourse.google_classroom_url ||
                           !!backendCourse.enrollmentCode ||
                           !!backendCourse.ownerId

  // 處理課程時間表（教師API返回的是 schedules 陣列）
  const schedules = backendCourse.schedules?.map((schedule: any) => ({
    dayOfWeek: schedule.day_of_week,
    startTime: schedule.start_time,
    endTime: schedule.end_time,
    location: schedule.location
  })) || []

  const result: Course = {
    id,
    name: courseName,
    courseCode: backendCourse.section || backendCourse.course_code || '',
    instructor: backendCourse.instructor || backendCourse.ownerId || '',
    classroom: backendCourse.classroom || backendCourse.room || backendCourse.location || '',
    studentCount: backendCourse.student_count || 0,
    schedule: schedules,
    color: backendCourse.color || '#3B82F6',
    createdAt: created,
    source: (isGoogleClassroom ? 'google_classroom' : 'manual') as 'google_classroom' | 'manual',
    googleClassroomUrl: backendCourse.google_classroom_url || backendCourse.alternate_link || 
                       (backendCourse.id ? `https://classroom.google.com/c/${backendCourse.id}` : undefined)
  }

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
  // 處理課程資訊（教師API返回的是 course_info 物件）
  let courseId = ''
  let courseName = ''
  
  if (backendAssignment.course_info) {
    courseId = String(backendAssignment.course_info.id || '')
    courseName = backendAssignment.course_info.name || ''
  } else if (backendAssignment.course) {
    const course = extractCourseIdAndName(backendAssignment.course)
    courseId = course.id
    courseName = backendAssignment.course_name || course.name || ''
  }

  // 確保 status 永遠有有效值，處理所有可能的無效情況
  // 教師API返回的是 state (PUBLISHED, DRAFT, DELETED)
  let status: "pending" | "completed" | "overdue" = "pending"
  const backendStatus = backendAssignment.status || backendAssignment.state
  
  if (backendStatus === "completed" || backendStatus === "COMPLETED") {
    status = "completed"
  } else if (backendStatus === "overdue" || backendStatus === "OVERDUE") {
    status = "overdue"
  } else if (backendStatus === "pending" || backendStatus === "PENDING" || backendStatus === "PUBLISHED") {
    status = "pending"
  }
  // 其他所有情況（null, undefined, "", DRAFT, DELETED）都使用默認值 "pending"

  // 處理到期日期（教師API返回的是 due_date 字串或 due_datetime）
  let dueDate = new Date()
  if (backendAssignment.due_date) {
    dueDate = new Date(backendAssignment.due_date)
  } else if (backendAssignment.due_datetime) {
    dueDate = new Date(backendAssignment.due_datetime)
  }

  // 處理創建和更新時間
  const createdAt = backendAssignment.created_at ? new Date(backendAssignment.created_at) :
                    backendAssignment.creation_time ? new Date(backendAssignment.creation_time) :
                    new Date()
  
  const updatedAt = backendAssignment.updated_at ? new Date(backendAssignment.updated_at) :
                    backendAssignment.update_time ? new Date(backendAssignment.update_time) :
                    new Date()

  return {
    id: String(backendAssignment.id),
    title: backendAssignment.title || backendAssignment.name || '',
    description: backendAssignment.description || '',
    dueDate: dueDate,
    courseId: courseId,
    courseName: courseName,
    status: status,
    priority: 'medium',
    createdAt: createdAt,
    updatedAt: updatedAt,
    googleClassroomId: backendAssignment.google_coursework_id || backendAssignment.id || undefined,
    googleClassroomUrl: backendAssignment.google_classroom_url || undefined,
    source: backendAssignment.google_coursework_id || backendAssignment.google_classroom_url ? 'google_classroom' : 'manual',
    // 添加提醒時間相關欄位
    customReminderTiming: backendAssignment.custom_reminder_timing || 'default',
    notificationTime: backendAssignment.notification_time ? new Date(backendAssignment.notification_time) : undefined
  }
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
