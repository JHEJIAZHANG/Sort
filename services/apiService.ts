import { createCsrfHeaders, fetchCsrfToken } from '@/lib/csrf-token'

// 根據環境設定 API 基礎 URL
function getApiBaseUrl(): string {
  // 在瀏覽器環境中，使用 Next.js 代理
  if (typeof window !== 'undefined') {
    return '/api/v2'
  }

  // 在伺服器環境中，使用環境變數
  return process.env.BACKEND_API_URL ? `${process.env.BACKEND_API_URL}/api/v2` : '/api/v2'
}

const API_BASE_URL = getApiBaseUrl()

// 取得後端基礎 URL (不包含 /api/v2)
function getBackendBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return ''
  }

  return process.env.BACKEND_API_URL || ''
}

// 取得 CSRF token
function getCsrfToken(): string | null {
  if (typeof window === 'undefined') {
    return null
  }

  const cookies = document.cookie.split(';')
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i].trim()
    if (cookie.startsWith('csrftoken=')) {
      return decodeURIComponent(cookie.substring(10))
    }
  }
  return null
}
export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
  details?: any
}

export class ApiService {
  private static lineUserId: string = ''
  static get backendOrigin() {
    try { return new URL(API_BASE_URL).origin } catch { return '' }
  }

  static setLineUserId(userId: string) {
    // 設定用戶 ID
    if (typeof userId === 'string' && userId.trim()) {
      this.lineUserId = userId
    } else {
      console.warn('Invalid LINE User ID provided')
    }
  }

  private static ensureLineUserId(): string {
    if (this.lineUserId && this.lineUserId.trim()) return this.lineUserId
    return this.bootstrapLineUserId()
  }

  static getLineUserId() {
    return this.lineUserId
  }

  // 不再產生訪客 ID；僅從現有狀態或儲存中取得（若不存在則回傳空字串）
  static bootstrapLineUserId(): string {
    // 完全移除 localStorage 依賴；僅回傳記憶體中的值
    return this.lineUserId || ''
  }

  private static async request<T = any>(
    endpoint: string,
    options: RequestInit = {},
    // 新增：API 路徑前綴，預設為 /api/v2
    apiPrefix: 'v2' | 'oauth' | 'onboard' | 'other' = 'v2'
  ): Promise<ApiResponse<T>> {
    try {
      const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData

      // 根據前綴決定基礎 URL
      let baseUrl: string
      if (typeof window !== 'undefined') {
        // 瀏覽器端一律走 Next.js 代理，避免公開變數配置錯誤造成跨網域與 CORS 問題
        if (apiPrefix === 'oauth') baseUrl = '/api/oauth'
        else if (apiPrefix === 'onboard') baseUrl = '/api'
        else if (apiPrefix === 'other') baseUrl = '/api'
        else baseUrl = '/api/v2'
      } else {
        // 伺服器端，使用環境變數
        const backendUrl = process.env.BACKEND_API_URL || ''
        if (apiPrefix === 'oauth') baseUrl = `${backendUrl}/api/oauth`
        else if (apiPrefix === 'onboard') baseUrl = `${backendUrl}/api`
        else if (apiPrefix === 'other') baseUrl = `${backendUrl}/api`
        else baseUrl = `${backendUrl}/api/v2`
      }

      const baseHeaders: Record<string, any> = {
        'X-Line-User-Id': this.lineUserId,
        ...(options.headers || {}),
      }
      if (!isFormData) {
        baseHeaders['Content-Type'] = 'application/json'
      }

      // 無論目標是否為 ngrok，統一添加 ngrok-skip-browser-warning 以避免警告頁阻擋
      baseHeaders['ngrok-skip-browser-warning'] = 'true'

      const fullUrl = `${baseUrl}${endpoint}`
      console.log(`[API] Making request to: ${fullUrl}`)

      const response = await fetch(fullUrl, {
        ...options,
        headers: {
          ...baseHeaders,
          // 合併 CSRF 標頭（若存在）
          ...createCsrfHeaders()
        },
        // 確保 cookies (csrftoken、session) 會隨請求送出
        credentials: 'include',
        // 避免瀏覽器層快取舊資料
        cache: 'no-store'
      })

      if (!response.ok) {
        // 後端可能回傳非 JSON 錯誤或空 body
        const errText = await response.text().catch(() => '')
        let errJson: any = {}
        try { errJson = errText ? JSON.parse(errText) : {} } catch { errJson = {} }
        // 強化錯誤輸出，便於定位 400 的真正原因
        try {
          console.error('[API] Request failed', {
            url: fullUrl,
            method: options.method || 'GET',
            status: response.status,
            statusText: response.statusText,
            contentType: response.headers.get('content-type') || '',
            bodyPreview: errText ? errText.slice(0, 500) : '',
            json: errJson,
          })
        } catch { }
        return {
          error: errJson.message || `HTTP ${response.status}`,
          details: errJson || errText
        }
      }

      // 處理 204 或空 body
      const contentType = response.headers.get('content-type') || ''
      if (response.status === 204) {
        return { data: null as any }
      }
      const raw = await response.text()
      if (!raw) {
        return { data: null as any }
      }
      if (!contentType.includes('application/json')) {
        return { data: raw as any }
      }
      const data = JSON.parse(raw)
      return { data }
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : '網路錯誤'
      }
    }
  }

  // 用戶相關 API
  static async getProfile(lineUserId: string) {
    return this.request(`/profile/${lineUserId}/`)
  }

  static async updateProfile(lineUserId: string, data: any) {
    // 將前端的 camelCase 轉換為後端的 snake_case
    const apiData: any = {}
    
    if (data.name !== undefined) apiData.name = data.name
    if (data.role !== undefined) apiData.role = data.role
    if (data.email !== undefined) apiData.email = data.email
    if (data.googleEmail !== undefined) apiData.email = data.googleEmail
    if (data.pictureUrl !== undefined) apiData.picture_url = data.pictureUrl
    
    return this.request(`/profile/${lineUserId}/`, {
      method: 'PUT',
      body: JSON.stringify(apiData)
    })
  }

  static async deleteAccount(lineUserId: string) {
    return this.request(`/users/delete`, {
      method: 'DELETE',
      body: JSON.stringify({ line_user_id: lineUserId })
    }, 'onboard')
  }

  // 通知設定相關 API
  static async getNotificationSettings(lineUserId: string) {
    return this.request(`/notification-settings/${lineUserId}`)
  }

  static async updateNotificationSettings(lineUserId: string, settings: any) {
    return this.request(`/notification-settings/${lineUserId}`, {
      method: 'PUT',
      body: JSON.stringify(settings)
    })
  }

  // 課程相關 API
  static async getCourses(lineUserId: string) {
    this.setLineUserId(lineUserId)
    const effective = this.ensureLineUserId()
    const qs = `?${new URLSearchParams({ line_user_id: effective, _ts: String(Date.now()) }).toString()}`
    const resp = await this.request<any>(`/web/courses/list/${qs}`)
    if (resp?.error) return resp
    const courses = resp?.data?.data?.courses ?? []
    return { data: courses }
  }

  static async createCourse(data: any) {
    // 確保有可用的 lineUserId，並放入 body 以通過後端驗證
    // 需要真實的 lineUserId，不再自動產生訪客 ID
    if (!this.lineUserId) {
      this.bootstrapLineUserId()
    }
    const payload = { line_user_id: this.lineUserId, ...data }
    const resp = await this.request<any>('/web/courses/create/', {
      method: 'POST',
      body: JSON.stringify(payload)
    })
    if (resp?.error) return resp
    // 後端 web_* 多半回傳 { success, data } 格式，這裡攤平成 data
    const entity = (resp as any)?.data?.data || (resp as any)?.data
    return { data: entity }
  }

  static async updateCourse(courseId: string, data: any) {
    if (!this.lineUserId) {
      this.bootstrapLineUserId()
    }
    const payload = { line_user_id: this.lineUserId, course_id: courseId, ...data }
    const resp = await this.request<any>('/web/courses/update/', {
      method: 'PATCH',
      body: JSON.stringify(payload)
    })
    if (resp?.error) return resp
    const entity = (resp as any)?.data?.data || (resp as any)?.data
    return { data: entity }
  }

  static async deleteCourse(courseId: string) {
    if (!this.lineUserId) {
      this.bootstrapLineUserId()
    }
    const payload = { line_user_id: this.lineUserId, course_id: courseId }
    return this.request('/web/courses/delete/', {
      method: 'DELETE',
      body: JSON.stringify(payload)
    })
  }

  // 作業相關 API
  static async getAssignments(lineUserId: string) {
    this.setLineUserId(lineUserId)
    const effective = this.ensureLineUserId()
    const qs = `?${new URLSearchParams({ line_user_id: effective, _ts: String(Date.now()) }).toString()}`
    const resp = await this.request<any>(`/web/assignments/list/${qs}`)
    if (resp?.error) return resp
    const assignments = resp?.data?.data?.assignments ?? []
    return { data: assignments }
  }

  static async createAssignment(data: any) {
    if (!this.lineUserId) {
      this.bootstrapLineUserId()
    }
    // 轉換前端鍵名到後端需求
    const payload: any = { line_user_id: this.lineUserId, ...data }
    if (payload.course) {
      payload.course_id = payload.course
      delete payload.course
    }
    // 映射提醒欄位：customReminderTiming -> custom_reminder_timing；notificationTime -> notification_time
    if (Object.prototype.hasOwnProperty.call(payload, 'customReminderTiming') && payload.customReminderTiming !== undefined) {
      payload.custom_reminder_timing = payload.customReminderTiming
      delete payload.customReminderTiming
    }
    if (Object.prototype.hasOwnProperty.call(payload, 'notificationTime') && payload.notificationTime !== undefined) {
      payload.notification_time = payload.notificationTime
      delete payload.notificationTime
    }
    // 確保 status 有默認值
    if (!payload.status) {
      payload.status = 'pending'
    }
    const resp = await this.request<any>('/web/assignments/create/', {
      method: 'POST',
      body: JSON.stringify(payload)
    })
    if (resp?.error) return resp
    const entity = (resp as any)?.data?.data || (resp as any)?.data
    return { data: entity }
  }

  static async updateAssignment(assignmentId: string, data: any) {
    if (!this.lineUserId) {
      this.bootstrapLineUserId()
    }
    const payload: any = { line_user_id: this.lineUserId, assignment_id: assignmentId, ...data }
    if (payload.course) {
      payload.course_id = payload.course
      delete payload.course
    }
    // 映射提醒欄位：customReminderTiming -> custom_reminder_timing；notificationTime -> notification_time
    if (Object.prototype.hasOwnProperty.call(payload, 'customReminderTiming') && payload.customReminderTiming !== undefined) {
      payload.custom_reminder_timing = payload.customReminderTiming
      delete payload.customReminderTiming
    }
    if (Object.prototype.hasOwnProperty.call(payload, 'notificationTime') && payload.notificationTime !== undefined) {
      payload.notification_time = payload.notificationTime
      delete payload.notificationTime
    }
    const resp = await this.request<any>('/web/assignments/update/', {
      method: 'PATCH',
      body: JSON.stringify(payload)
    })
    if (resp?.error) return resp
    const entity = (resp as any)?.data?.data || (resp as any)?.data
    return { data: entity }
  }

  static async updateAssignmentStatus(assignmentId: string, status: 'pending' | 'completed' | 'overdue', retryCount = 0): Promise<ApiResponse<any>> {
    if (!this.lineUserId) {
      this.bootstrapLineUserId()
    }

    console.log('API: 更新作業狀態', { assignmentId, status, lineUserId: this.lineUserId, retryCount })

    const payload = { status, line_user_id: this.lineUserId }

    try {
      const response = await this.request(`/assignments/${assignmentId}/status/`, {
        method: 'POST',
        body: JSON.stringify(payload)
      })

      console.log('API: 更新作業狀態響應', response)

      // 如果API調用成功但沒有返回完整資料，記錄警告
      if (!response.error && response.data) {
        const data = response.data as any
        const hasRequiredFields = data.id && data.title
        if (!hasRequiredFields) {
          console.warn('API返回的作業資料不完整:', response.data)
        }
      }

      return response

    } catch (error) {
      // 網路錯誤時重試
      if (retryCount < 2 && (error instanceof Error && error.message.includes('網路錯誤'))) {
        console.log(`API調用失敗，進行第 ${retryCount + 1} 次重試`)
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1))) // 遞增延遲
        return this.updateAssignmentStatus(assignmentId, status, retryCount + 1)
      }

      throw error
    }
  }

  static async deleteAssignment(assignmentId: string) {
    if (!this.lineUserId) {
      this.bootstrapLineUserId()
    }
    const payload = { line_user_id: this.lineUserId, assignment_id: assignmentId }
    return this.request('/web/assignments/delete/', {
      method: 'DELETE',
      body: JSON.stringify(payload)
    })
  }

  static async getAssignmentRecommendations(assignmentId: string, options?: { limit?: number; perSource?: number; q?: string }) {
    const limit = options?.limit
    const perSource = options?.perSource
    const q = options?.q
    const qs = new URLSearchParams()
    if (typeof limit === 'number') qs.set('limit', String(limit))
    if (typeof perSource === 'number') qs.set('per_source', String(perSource))
    if (typeof q === 'string' && q.trim()) qs.set('q', q.trim())
    const suffix = qs.toString() ? `?${qs.toString()}` : ''
    return this.request<{
      assignment: string
      query: string
      results: Array<{ source: string; url: string; title: string; snippet?: string; score?: number }>
      meta?: { sources?: Record<string, number> }
    }>(`/assignments/${assignmentId}/recommendations${suffix}`)
  }

  // 筆記相關 API
  static async getNotes(lineUserId: string) {
    this.setLineUserId(lineUserId)
    const effective = this.ensureLineUserId()
    const qs = `?${new URLSearchParams({ line_user_id: effective, _ts: String(Date.now()) }).toString()}`
    return this.request(`/notes/${qs}`)
  }

  static async createNote(data: any) {
    return this.request('/notes/', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  static async updateNote(noteId: string, data: any) {
    return this.request(`/notes/${noteId}/`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    })
  }

  static async deleteNote(noteId: string) {
    return this.request(`/notes/${noteId}/`, {
      method: 'DELETE'
    })
  }

  // 考試相關 API
  static async getExams(lineUserId: string) {
    this.setLineUserId(lineUserId)
    const effective = this.ensureLineUserId()
    const qs = `?${new URLSearchParams({ line_user_id: effective, _ts: String(Date.now()) }).toString()}`
    return this.request(`/exams/${qs}`)
  }

  static async createExam(data: any) {
    const payload: any = { ...data }
    if (Object.prototype.hasOwnProperty.call(payload, 'customReminderTiming') && payload.customReminderTiming !== undefined) {
      payload.custom_reminder_timing = payload.customReminderTiming
      delete payload.customReminderTiming
    }
    if (Object.prototype.hasOwnProperty.call(payload, 'notificationTime') && payload.notificationTime !== undefined) {
      payload.notification_time = payload.notificationTime
      delete payload.notificationTime
    }
    return this.request('/exams/', {
      method: 'POST',
      body: JSON.stringify(payload)
    })
  }

  static async updateExam(examId: string, data: any) {
    const payload: any = { ...data }
    if (Object.prototype.hasOwnProperty.call(payload, 'customReminderTiming') && payload.customReminderTiming !== undefined) {
      payload.custom_reminder_timing = payload.customReminderTiming
      delete payload.customReminderTiming
    }
    if (Object.prototype.hasOwnProperty.call(payload, 'notificationTime') && payload.notificationTime !== undefined) {
      payload.notification_time = payload.notificationTime
      delete payload.notificationTime
    }
    return this.request(`/exams/${examId}/`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    })
  }

  static async updateExamStatus(examId: string, status: 'pending' | 'completed' | 'overdue') {
    return this.request(`/exams/${examId}/status/`, {
      method: 'POST',
      body: JSON.stringify({ status })
    })
  }

  static async deleteExam(examId: string) {
    return this.request(`/exams/${examId}/`, {
      method: 'DELETE'
    })
  }

  static async getExamRecommendations(examId: string, options?: { limit?: number; perSource?: number; q?: string }) {
    const limit = options?.limit
    const perSource = options?.perSource
    const q = options?.q
    const qs = new URLSearchParams()
    if (typeof limit === 'number') qs.set('limit', String(limit))
    if (typeof perSource === 'number') qs.set('per_source', String(perSource))
    if (typeof q === 'string' && q.trim()) qs.set('q', q.trim())
    const suffix = qs.toString() ? `?${qs.toString()}` : ''
    return this.request<{
      exam: string
      query: string
      results: Array<{ source: string; url: string; title: string; snippet?: string; score?: number }>
      meta?: { sources?: Record<string, number> }
    }>(`/exams/${examId}/recommendations${suffix}`)
  }

  // 檔案相關 API
  static async uploadFile(file: File, extra?: { noteId?: string; courseId?: string; assignmentId?: string; examId?: string }) {
    // 確保 lineUserId 已初始化
    if (!this.lineUserId) {
      this.bootstrapLineUserId()
    }

    const formData = new FormData()
    formData.append('file', file)
    if (extra?.noteId) formData.append('noteId', extra.noteId)
    if (extra?.courseId) formData.append('courseId', extra.courseId)
    if (extra?.assignmentId) formData.append('assignmentId', extra.assignmentId)
    if (extra?.examId) formData.append('examId', extra.examId)

    return this.request('/files/', {
      method: 'POST',
      body: formData,
      headers: {
        'X-Line-User-Id': this.lineUserId,
        // 不設定 Content-Type，讓瀏覽器自動設定 multipart/form-data
      }
    })
  }

  static async getFile(fileId: string) {
    return this.request(`/files/${fileId}/`)
  }

  static async deleteFile(fileId: string) {
    return this.request(`/files/${fileId}/`, {
      method: 'DELETE'
    })
  }

  // 自訂分類 API
  static async getCustomCategories(lineUserId: string) {
    this.setLineUserId(lineUserId)
    const effective = this.ensureLineUserId()
    const qs = `?${new URLSearchParams({ line_user_id: effective }).toString()}`
    return this.request(`/custom-categories/${qs}`)
  }

  static async createCustomCategory(data: { name: string; icon?: string; color?: string }) {
    return this.request('/custom-categories/', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  static async updateCustomCategory(id: string, data: Partial<{ name: string; icon: string; color: string }>) {
    return this.request(`/custom-categories/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  }

  static async deleteCustomCategory(id: string) {
    return this.request(`/custom-categories/${id}/`, {
      method: 'DELETE'
    })
  }

  // 自訂待辦 API
  static async getCustomTodos(lineUserId: string, params?: Record<string, string>) {
    this.setLineUserId(lineUserId)
    const effective = this.ensureLineUserId()
    const merged = new URLSearchParams({ line_user_id: effective, ...(params || {}) })
    const query = `?${merged.toString()}`
    return this.request(`/custom-todos/${query}`)
  }

  static async createCustomTodo(data: {
    category?: string | null
    course?: string | null
    title: string
    description?: string
    due_date: string
    status?: 'pending' | 'completed' | 'overdue'
  }) {
    return this.request('/custom-todos/', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  static async updateCustomTodo(id: string, data: Partial<{ title: string; description: string; due_date: string; status: 'pending' | 'completed' | 'overdue'; category: string | null; course: string | null }>, retryCount = 0): Promise<ApiResponse<any>> {
    // 確保有可用的 lineUserId
    if (!this.lineUserId) {
      this.bootstrapLineUserId()
    }

    console.log('API: 更新待辦事項', { id, data, lineUserId: this.lineUserId, retryCount })

    try {
      const response = await this.request(`/custom-todos/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify(data),
        headers: {
          'X-Line-User-Id': this.lineUserId,
          'Content-Type': 'application/json'
        }
      })

      console.log('API: 更新待辦事項響應', response)
      return response

    } catch (error) {
      // 網路錯誤時重試
      if (retryCount < 2 && (error instanceof Error && error.message.includes('網路錯誤'))) {
        console.log(`API調用失敗，進行第 ${retryCount + 1} 次重試`)
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1))) // 遞增延遲
        return this.updateCustomTodo(id, data, retryCount + 1)
      }

      throw error
    }
  }

  static async deleteCustomTodo(id: string) {
    // 確保有可用的 lineUserId
    if (!this.lineUserId) {
      this.bootstrapLineUserId()
    }

    console.log('API: 刪除待辦事項', { id, lineUserId: this.lineUserId })

    const response = await this.request(`/custom-todos/${id}/`, {
      method: 'DELETE',
      headers: {
        'X-Line-User-Id': this.lineUserId,
        'Content-Type': 'application/json'
      }
    })

    console.log('API: 刪除待辦事項響應', response)
    return response
  }

  // 批量匯入課程
  static async importCourses(file: File) {
    const formData = new FormData()
    formData.append('file', file)

    return this.request('/files/import_courses/', {
      method: 'POST',
      body: formData,
      headers: {
        'X-Line-User-Id': this.lineUserId,
        // 不設定 Content-Type，讓瀏覽器自動設定 multipart/form-data
      }
    })
  }

  // 課表圖片 OCR 匯入（Gemini/Gemma 後端）
  static async importTimetableImage(image: File, options?: { preview?: boolean; dryRun?: boolean }) {
    if (!this.lineUserId) {
      this.bootstrapLineUserId()
    }
    const formData = new FormData()
    // 嘗試兩個欄位名以相容後端實作
    formData.append('file', image)
    formData.append('image', image)

    // 添加選項參數
    if (options?.preview) {
      formData.append('preview', 'true')
    }
    if (options?.dryRun) {
      formData.append('dryRun', 'true')
    }

    return this.request('/files/import-timetable-image/', {
      method: 'POST',
      body: formData,
      headers: {
        'X-Line-User-Id': this.lineUserId,
      }
    })
  }

  // OCR 預覽模式 - 獲取解析結果和衝突檢查
  static async previewTimetableImage(image: File) {
    return this.importTimetableImage(image, { preview: true })
  }

  // OCR 確認創建 - 使用編輯後的課程數據創建課程
  static async confirmTimetableImport(courses: any[]) {
    if (!this.lineUserId) {
      this.bootstrapLineUserId()
    }

    return this.request('/files/confirm-timetable-import/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Line-User-Id': this.lineUserId,
      },
      body: JSON.stringify({ courses })
    })
  }

  // OCR 預覽方法別名 - 與前端調用保持一致
  static async ocrSchedulePreview(image: File) {
    return this.previewTimetableImage(image)
  }

  // OCR 確認方法別名 - 與前端調用保持一致
  static async ocrScheduleConfirm(courses: any[]) {
    return this.confirmTimetableImport(courses)
  }

  // 課程時間設定（web）
  static async setCourseSchedule(courseId: string, schedules: Array<{ day_of_week: number; start_time: string; end_time: string; location?: string }>) {
    if (!this.lineUserId) {
      this.bootstrapLineUserId()
    }
    const payload = {
      line_user_id: this.lineUserId,
      course_id: courseId,
      schedules
    }
    return this.request('/web/courses/schedule/', {
      method: 'POST',
      body: JSON.stringify(payload)
    })
  }



  // AI 筆記摘要
  static async getNoteAiSummary(noteId: string) {
    return this.request(`/notes/${noteId}/ai/summary/`, {
      method: 'POST'
    })
  }

  // 將 Office 檔案轉換為 PDF
  static async convertOfficeToPdf(fileUrl: string) {
    if (!this.lineUserId) {
      this.bootstrapLineUserId()
    }
    return this.request<{ pdf_url: string }>('/files/convert-to-pdf/', {
      method: 'POST',
      body: JSON.stringify({
        file_url: fileUrl,
        line_user_id: this.lineUserId
      })
    })
  }

  // Google Classroom 同步相關 API
  static async syncGoogleClassroom() {
    if (!this.lineUserId) {
      this.bootstrapLineUserId()
    }
    return this.request('/sync/classroom-to-v2/', {
      method: 'POST',
      body: JSON.stringify({ line_user_id: this.lineUserId })
    })
  }

  static async syncGoogleClassroomCourse(courseId: string) {
    if (!this.lineUserId) {
      this.bootstrapLineUserId()
    }
    return this.request('/sync/classroom-course/', {
      method: 'POST',
      body: JSON.stringify({
        line_user_id: this.lineUserId,
        google_course_id: courseId
      })
    })
  }

  static async getGoogleSyncStatus() {
    if (!this.lineUserId) {
      this.bootstrapLineUserId()
    }
    return this.request(`/sync/status/?line_user_id=${this.lineUserId}`, {
      method: 'GET'
    })
  }

  static async getGoogleApiStatus() {
    if (!this.lineUserId) {
      this.bootstrapLineUserId()
    }
    return this.request(`/sync/google-status/?line_user_id=${this.lineUserId}`, {
      method: 'GET'
    })
  }



  static async triggerAutoSync() {
    if (!this.lineUserId) {
      this.bootstrapLineUserId()
    }
    return this.request('/sync/auto-trigger/', {
      method: 'POST',
      body: JSON.stringify({ line_user_id: this.lineUserId })
    })
  }

  static async manualSyncAll(courseIds?: string[]) {
    if (!this.lineUserId) {
      this.bootstrapLineUserId()
    }
    const payload: any = { line_user_id: this.lineUserId }
    if (Array.isArray(courseIds) && courseIds.length > 0) {
      payload.course_ids = courseIds
    }
    return this.request('/sync/manual-sync-all/', {
      method: 'POST',
      body: JSON.stringify(payload)
    })
  }

  // Google Classroom 同步預覽
  static async previewSyncAll() {
    // 確保有 LINE User ID
    const lineUserId = this.ensureLineUserId()
    if (!lineUserId || lineUserId.trim() === '') {
      throw new Error('LINE User ID 未設置，請確認已正確登入')
    }
    
    return this.request('/sync/preview-sync-all/', {
      method: 'POST',
      body: JSON.stringify({ line_user_id: lineUserId })
    })
  }

  // Google Classroom 確認匯入
  static async confirmImport(params: {
    courses: string[]
    assignments?: string[]
    schedules?: Record<string, Array<{
      day_of_week: number
      start_time: string
      end_time: string
      location?: string
    }>>
  }) {
    // 確保有 LINE User ID
    const lineUserId = this.ensureLineUserId()
    if (!lineUserId || lineUserId.trim() === '') {
      throw new Error('LINE User ID 未設置，請確認已正確登入')
    }
    
    return this.request('/sync/confirm-import/', {
      method: 'POST',
      body: JSON.stringify({ 
        line_user_id: lineUserId,
        selected_items: {
          courses: params.courses,
          ...(params.assignments && { assignments: params.assignments })
        },
        course_schedules: params.schedules || {}
      })
    })
  }

  // 同步指定課程的作業
  static async syncAssignments(courseIds: string[]) {
    // 確保有 LINE User ID
    const lineUserId = this.ensureLineUserId()
    if (!lineUserId || lineUserId.trim() === '') {
      throw new Error('LINE User ID 未設置，請確認已正確登入')
    }
    
    return this.request('/sync/sync-assignments/', {
      method: 'POST',
      body: JSON.stringify({ 
        line_user_id: lineUserId,
        course_ids: courseIds
      })
    })
  }

  // ==================== 教師專用 Google Classroom API ====================
  
  // 教師課程預覽
  static async teacherPreviewImport() {
    const lineUserId = this.ensureLineUserId()
    if (!lineUserId || lineUserId.trim() === '') {
      throw new Error('LINE User ID 未設置，請確認已正確登入')
    }
    
    return this.request('/classroom/teacher/preview-import/', {
      method: 'POST',
      body: JSON.stringify({ line_user_id: lineUserId })
    }, 'other')
  }

  // 教師課程確認匯入
  static async teacherConfirmImport(params: {
    selected_courses: string[]
    course_schedules?: Record<string, Array<{
      day_of_week: number
      start_time: string
      end_time: string
      location?: string
    }>>
  }) {
    const lineUserId = this.ensureLineUserId()
    if (!lineUserId || lineUserId.trim() === '') {
      throw new Error('LINE User ID 未設置，請確認已正確登入')
    }
    
    return this.request('/classroom/teacher/confirm-import/', {
      method: 'POST',
      body: JSON.stringify({ 
        line_user_id: lineUserId,
        selected_courses: params.selected_courses,
        course_schedules: params.course_schedules || {}
      })
    }, 'other')
  }

  // 教師作業手動同步
  static async teacherSyncAssignments(params?: {
    mode?: 'all_active' | 'selected'
    course_ids?: string[]
  }) {
    const lineUserId = this.ensureLineUserId()
    if (!lineUserId || lineUserId.trim() === '') {
      throw new Error('LINE User ID 未設置，請確認已正確登入')
    }
    
    return this.request('/classroom/teacher/sync-assignments/', {
      method: 'POST',
      body: JSON.stringify({ 
        line_user_id: lineUserId,
        mode: params?.mode || 'all_active',
        course_ids: params?.course_ids || []
      })
    }, 'other')
  }

  // Google OAuth 相關 API
  static async getGoogleOAuthUrl(userData?: { role?: 'teacher' | 'student'; name?: string }) {
    if (!this.lineUserId) {
      this.bootstrapLineUserId()
    }
    // 在瀏覽器端，先嘗試取得 CSRF token（避免 403）
    if (typeof window !== 'undefined') {
      try { await fetchCsrfToken('') } catch { }
    }

    // 構建請求體，包含用戶數據（如果提供的話）
    const requestBody: any = { line_user_id: this.lineUserId }
    if (userData?.role) {
      requestBody.role = userData.role
    }
    if (userData?.name) {
      requestBody.name = userData.name
    }

    return this.request<{ auth_url: string }>('/google/url/', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    }, 'oauth')
  }

  // 預註冊（LIFF）取得 Google 授權 URL，需 CSRF 與 id_token
  static async preRegister(params: { id_token: string; role: 'teacher' | 'student'; name: string }) {
    const { id_token, role, name } = params
    if (!this.lineUserId) {
      this.bootstrapLineUserId()
    }

    // 需要在瀏覽器端先取得 CSRF cookie
    if (typeof window !== 'undefined') {
      try { await fetchCsrfToken('') } catch { }
    }

    return this.request<{ redirectUrl: string }>(
      '/onboard/pre_register/',
      {
        method: 'POST',
        body: JSON.stringify({
          id_token,
          line_user_id: this.lineUserId,
          role,
          name,
        }),
      },
      'onboard'
    )
  }

  // Google Calendar 相關 API
  static async getCalendarEvents(params?: {
    calendar_id?: string
    time_min?: string
    time_max?: string
    max_results?: number
  }) {
    if (!this.lineUserId) {
      this.bootstrapLineUserId()
    }

    const queryParams = new URLSearchParams({
      line_user_id: this.lineUserId,
      calendar_id: params?.calendar_id || 'primary',
      ...(params?.time_min && { time_min: params.time_min }),
      ...(params?.time_max && { time_max: params.time_max }),
      ...(params?.max_results && { max_results: params.max_results.toString() })
    })

    return this.request(`/calendar/get_calendar_events/?${queryParams}`, {
      method: 'GET'
    })
  }

  static async createCalendarEvent(data: {
    calendar_id?: string
    summary: string
    description?: string
    start_datetime: string
    end_datetime: string
    location?: string
    attendees?: string[]
  }) {
    if (!this.lineUserId) {
      this.bootstrapLineUserId()
    }

    return this.request('/calendar/create_calendar_event/', {
      method: 'POST',
      body: JSON.stringify({
        line_user_id: this.lineUserId,
        calendar_id: data.calendar_id || 'primary',
        ...data
      })
    })
  }

  static async updateCalendarEvent(data: {
    calendar_id?: string
    event_id: string
    summary?: string
    description?: string
    start_datetime?: string
    end_datetime?: string
    location?: string
    attendees?: string[]
  }) {
    if (!this.lineUserId) {
      this.bootstrapLineUserId()
    }

    return this.request('/calendar/update_calendar_event/', {
      method: 'PATCH',
      body: JSON.stringify({
        line_user_id: this.lineUserId,
        calendar_id: data.calendar_id || 'primary',
        ...data
      })
    })
  }

  static async deleteCalendarEvent(data: {
    calendar_id?: string
    event_id: string
  }) {
    if (!this.lineUserId) {
      this.bootstrapLineUserId()
    }

    return this.request('/calendar/delete_calendar_event/', {
      method: 'DELETE',
      body: JSON.stringify({
        line_user_id: this.lineUserId,
        calendar_id: data.calendar_id || 'primary',
        event_id: data.event_id
      })
    })
  }

  static async manageCalendarAttendees(data: {
    calendar_id?: string
    event_id: string
    attendees?: string[]
    attendees_to_remove?: string[]
  }) {
    if (!this.lineUserId) {
      this.bootstrapLineUserId()
    }

    return this.request('/calendar/events/attendees/', {
      method: 'POST',
      body: JSON.stringify({
        line_user_id: this.lineUserId,
        calendar_id: data.calendar_id || 'primary',
        ...data
      })
    })
  }

  // ==================== 教師專用 API ====================
  
  // 教師課程列表（根據 API 文件：/api/courses/）
  static async getTeacherCourses(lineUserId: string) {
    this.setLineUserId(lineUserId)
    const effective = this.ensureLineUserId()
    const qs = `?${new URLSearchParams({ line_user_id: effective, _ts: String(Date.now()) }).toString()}`
    const resp = await this.request<any>(`/courses/${qs}`, {}, 'other')
    if (resp?.error) return resp
    const courses = resp?.data?.courses ?? []
    return { data: courses }
  }

  // 教師作業列表（根據 API 文件：/api/teacher/assignments/）
  static async getTeacherAssignments(lineUserId: string, params?: {
    course_id?: string
    status?: string
    upcoming_within_days?: number
  }) {
    this.setLineUserId(lineUserId)
    const effective = this.ensureLineUserId()
    const queryParams = new URLSearchParams({ 
      line_user_id: effective, 
      _ts: String(Date.now()) 
    })
    if (params?.course_id) queryParams.set('course_id', params.course_id)
    if (params?.status) queryParams.set('status', params.status)
    if (params?.upcoming_within_days) queryParams.set('upcoming_within_days', String(params.upcoming_within_days))
    
    const qs = `?${queryParams.toString()}`
    const resp = await this.request<any>(`/teacher/assignments/${qs}`, {}, 'other')
    if (resp?.error) return resp
    const assignments = resp?.data?.assignments ?? []
    return { data: assignments }
  }
  
  // 教師課程詳情相關 API
  static async getTeacherCourseDetail(courseId: string) {
    if (!this.lineUserId) {
      this.bootstrapLineUserId()
    }
    const qs = `?${new URLSearchParams({ line_user_id: this.lineUserId, _ts: String(Date.now()) }).toString()}`
    return this.request(`/teacher/courses/${courseId}/detail/${qs}`)
  }

  static async getCourseStudents(courseId: string) {
    if (!this.lineUserId) {
      this.bootstrapLineUserId()
    }
    const qs = `?${new URLSearchParams({ line_user_id: this.lineUserId, course_id: courseId, _ts: String(Date.now()) }).toString()}`
    return this.request(`/teacher/courses/${courseId}/students/${qs}`)
  }

  static async getCourseAssignments(courseId: string) {
    if (!this.lineUserId) {
      this.bootstrapLineUserId()
    }
    const qs = `?${new URLSearchParams({ line_user_id: this.lineUserId, course_id: courseId, _ts: String(Date.now()) }).toString()}`
    return this.request(`/teacher/courses/${courseId}/assignments/${qs}`)
  }

  static async sendAssignmentReminder(assignmentId: string, studentIds?: string[]) {
    if (!this.lineUserId) {
      this.bootstrapLineUserId()
    }
    return this.request('/teacher/assignments/reminder/', {
      method: 'POST',
      body: JSON.stringify({
        line_user_id: this.lineUserId,
        assignment_id: assignmentId,
        student_ids: studentIds
      })
    })
  }

  static async getCourseLineGroups(courseId: string) {
    if (!this.lineUserId) {
      this.bootstrapLineUserId()
    }
    const qs = `?${new URLSearchParams({ line_user_id: this.lineUserId, course_id: courseId }).toString()}`
    return this.request(`/teacher/courses/${courseId}/line-groups/${qs}`)
  }

  static async bindCourseToLineGroup(courseId: string, groupId: string) {
    if (!this.lineUserId) {
      this.bootstrapLineUserId()
    }
    return this.request('/teacher/courses/bind-line-group/', {
      method: 'POST',
      body: JSON.stringify({
        line_user_id: this.lineUserId,
        course_id: courseId,
        group_id: groupId
      })
    })
  }

  static async unbindCourseFromLineGroup(courseId: string, groupId: string) {
    if (!this.lineUserId) {
      this.bootstrapLineUserId()
    }
    return this.request('/teacher/courses/unbind-line-group/', {
      method: 'DELETE',
      body: JSON.stringify({
        line_user_id: this.lineUserId,
        course_id: courseId,
        group_id: groupId
      })
    })
  }

  static async getCourseWeeklyReport(courseId: string, weekStart?: string) {
    if (!this.lineUserId) {
      this.bootstrapLineUserId()
    }
    const params = new URLSearchParams({ 
      line_user_id: this.lineUserId, 
      course_id: courseId,
      _ts: String(Date.now())
    })
    if (weekStart) {
      params.set('week_start', weekStart)
    }
    const qs = `?${params.toString()}`
    return this.request(`/teacher/courses/${courseId}/weekly-report/${qs}`)
  }

  static async sendWeeklyReport(courseId: string, reportData: any) {
    if (!this.lineUserId) {
      this.bootstrapLineUserId()
    }
    return this.request('/teacher/courses/send-weekly-report/', {
      method: 'POST',
      body: JSON.stringify({
        line_user_id: this.lineUserId,
        course_id: courseId,
        ...reportData
      })
    })
  }


}

// PATCH TEST 1760122225897
