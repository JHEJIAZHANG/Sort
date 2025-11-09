export interface Course {
  id: string
  name: string
  courseCode?: string // 添加課程代碼欄位
  instructor?: string
  classroom?: string
  studentCount?: number // 添加學生人數欄位
  schedule: {
    dayOfWeek: number // 0-6 (Monday-Sunday)
    startTime: string // HH:MM format
    endTime: string // HH:MM format
    location?: string
  }[]
  color: string
  createdAt: Date
  source?: "google_classroom" | "manual" // Added source field to distinguish between Google Classroom and manual courses
  googleClassroomUrl?: string // Google Classroom 課程連結
}

export interface Assignment {
  id: string
  courseId: string
  courseName?: string
  title: string
  description?: string
  dueDate: Date
  notificationTime?: Date
  status: "pending" | "completed" | "overdue"
  priority?: "low" | "medium" | "high"
  googleClassroomId?: string
  googleClassroomUrl?: string
  source?: "manual" | "google_classroom"
  customReminderTiming?: "15min" | "30min" | "1hour" | "2hours" | "1day" | "2days" | "1week" | "default" // 個別提醒時間設定，default 表示使用統一設定
  createdAt?: Date
  updatedAt?: Date
}

export interface Note {
  id: string
  courseId: string
  courseName?: string
  title: string
  content: string
  tags?: string[]
  attachments?: {
    id: string
    name: string
    size: number
    type: string
    url: string
  }[]
  createdAt: Date
  updatedAt: Date
}

export interface Exam {
  id: string
  courseId: string
  courseName?: string
  title: string
  description?: string
  examDate: Date
  notificationTime?: Date
  duration: number // in minutes
  location?: string
  type: "midterm" | "final" | "quiz" | "other"
  status: "pending" | "completed" | "overdue"
  customReminderTiming?: "15min" | "30min" | "1hour" | "2hours" | "1day" | "2days" | "1week" | "default" // 個別提醒時間設定，default 表示使用統一設定
  annotations?: string[] // 考試標註/重點標記
  notes?: string // 考試筆記
  createdAt: Date
  updatedAt: Date
}

export type Task = Assignment | Exam

export interface TaskFilter {
  type: "all" | "assignment" | "exam"
  status: "all" | "pending" | "completed" | "overdue" | "upcoming" | "scheduled"
}
