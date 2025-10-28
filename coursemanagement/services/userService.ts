import { UserRole } from '@/hooks/use-registration-flow'

export interface UserRegistrationData {
  role: UserRole
  name: string
  googleEmail: string
  lineUserId: string
  registeredAt: string
}

export interface UserProfile {
  id: string
  role: UserRole
  name: string
  email?: string
  googleEmail?: string
  lineUserId: string
  pictureUrl?: string
  registeredAt?: string
  lastLoginAt?: string
  isActive?: boolean
}

// 後端 API 回傳的格式（snake_case）
interface ApiUserProfile {
  id?: string
  line_user_id: string
  name: string
  email?: string
  role: UserRole
  picture_url?: string
  registered_at?: string
  last_login_at?: string
  is_active?: boolean
}

export class UserService {
  private static lastLoginRecord: { lineUserId: string; at: number } | null = null
  private static resolveBaseUrl(): string {
    const candidate = (typeof window !== 'undefined')
      ? process.env.NEXT_PUBLIC_API_URL
      : (process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL)

    if (!candidate) {
      throw new Error('BACKEND_API_URL is not configured')
    }

    return candidate.replace(/\/+$/, '')
  }

  private static getOnboardBase(): string {
    const raw = this.resolveBaseUrl()
    const lower = raw.toLowerCase()
    if (/\/api\/v2$/.test(lower)) return raw.replace(/\/api\/v2$/, '/api')
    if (/\/api$/.test(lower)) return raw
    return `${raw}/api`
  }

  /**
   * 註冊新用戶並綁定 LINE User ID 與 Google Email
   */
  static async registerUser(data: UserRegistrationData): Promise<UserProfile> {
    try {
      const baseUrl = this.resolveBaseUrl()
      const response = await fetch(`${baseUrl}/api/users/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error(`註冊失敗: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('用戶註冊失敗:', error)
      throw error
    }
  }

  /**
   * 將後端 API 格式轉換為前端格式
   */
  private static transformApiProfile(apiProfile: ApiUserProfile): UserProfile {
    return {
      id: apiProfile.id || apiProfile.line_user_id,
      lineUserId: apiProfile.line_user_id,
      name: apiProfile.name,
      email: apiProfile.email,
      googleEmail: apiProfile.email, // 後端使用 email 欄位
      role: apiProfile.role,
      pictureUrl: apiProfile.picture_url,
      registeredAt: apiProfile.registered_at,
      lastLoginAt: apiProfile.last_login_at,
      isActive: apiProfile.is_active ?? true
    }
  }

  /**
   * 根據 LINE User ID 獲取用戶資料
   */
  static async getUserByLineId(lineUserId: string): Promise<UserProfile | null> {
    try {
      const baseUrl = this.resolveBaseUrl()
      const response = await fetch(`${baseUrl}/api/v2/profile/${lineUserId}/`, {
        headers: {
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        credentials: 'include',
        cache: 'no-store',
      })

      if (response.status === 404) {
        return null // 用戶不存在
      }

      if (!response.ok) {
        throw new Error(`獲取用戶資料失敗: ${response.statusText}`)
      }

      const apiProfile: ApiUserProfile = await response.json()
      return this.transformApiProfile(apiProfile)
    } catch (error) {
      console.error('獲取用戶資料失敗:', error)
      throw error
    }
  }

  /**
   * 根據 Google Email 獲取用戶資料
   */
  static async getUserByGoogleEmail(googleEmail: string): Promise<UserProfile | null> {
    try {
      const baseUrl = this.resolveBaseUrl()
      const response = await fetch(`${baseUrl}/api/users/google/${encodeURIComponent(googleEmail)}`)

      if (response.status === 404) {
        return null // 用戶不存在
      }

      if (!response.ok) {
        throw new Error(`獲取用戶資料失敗: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('獲取用戶資料失敗:', error)
      throw error
    }
  }

  /**
   * 更新用戶資料
   */
  static async updateUser(userId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    try {
      const baseUrl = this.resolveBaseUrl()
      const response = await fetch(`${baseUrl}/api/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        throw new Error(`更新用戶資料失敗: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('更新用戶資料失敗:', error)
      throw error
    }
  }

  /**
   * 檢查 LINE User ID 是否已註冊
   */
  static async checkLineUserExists(lineUserId: string): Promise<boolean> {
    try {
      const user = await this.getUserByLineId(lineUserId)
      return user !== null
    } catch (error) {
      console.error('檢查用戶是否存在失敗:', error)
      return false
    }
  }

  /**
   * 檢查 Google Email 是否已註冊
   */
  static async checkGoogleEmailExists(googleEmail: string): Promise<boolean> {
    try {
      const user = await this.getUserByGoogleEmail(googleEmail)
      return user !== null
    } catch (error) {
      console.error('檢查 Google Email 是否存在失敗:', error)
      return false
    }
  }

  /**
   * 綁定 LINE User ID 與 Google Email
   */
  static async bindLineAndGoogle(lineUserId: string, googleEmail: string): Promise<boolean> {
    try {
      const baseUrl = this.resolveBaseUrl()
      const response = await fetch(`${baseUrl}/api/users/bind`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lineUserId,
          googleEmail,
        }),
      })

      if (!response.ok) {
        throw new Error(`綁定失敗: ${response.statusText}`)
      }

      return true
    } catch (error) {
      console.error('綁定 LINE 與 Google 失敗:', error)
      throw error
    }
  }

  /**
   * 記錄用戶登入
   */
  static async recordLogin(lineUserId: string): Promise<void> {
    try {
      if (!lineUserId) return
      console.log('[UserService] recordLogin 已停用，未呼叫後端 /api/users/login', { lineUserId })
      return
    } catch (error) {
      console.warn('recordLogin no-op 捕捉到非預期錯誤:', error)
    }
  }

  /**
   * 發送註冊完成 Flex Message 到 LINE Bot
   */
  static async sendRegistrationCompleteMessage(lineUserId: string, name: string, role: UserRole): Promise<boolean> {
    try {
      const baseUrl = this.resolveBaseUrl()
      const response = await fetch(`${baseUrl}/line/render-flex/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          template_name: 'register_done',
          line_user_id: lineUserId,
          name: name,
          role: role
        }),
      })

      if (!response.ok) {
        console.error('發送註冊完成 Flex Message 失敗:', response.statusText)
        return false
      }

      const result = await response.json()
      console.log('註冊完成 Flex Message 發送成功:', result)
      return true
    } catch (error) {
      console.error('發送註冊完成 Flex Message 失敗:', error)
      return false
    }
  }

  /**
   * 查詢是否已完成綁定（註冊完成）：後端依據 google_refresh_token 是否存在判定
   */
  static async getOnboardStatus(lineUserId: string): Promise<boolean> {
    try {
      const url = `${this.getOnboardBase()}/onboard/status/${lineUserId}/`
      console.log('[UserService] 查詢註冊狀態 URL:', url)
      const controller = new AbortController()
      // 縮短逾時以避免登入流程卡太久
      const timeout = setTimeout(() => controller.abort(), 4000)
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        credentials: 'include',
        cache: 'no-store',
        signal: controller.signal,
      })
      clearTimeout(timeout)
      if (!response.ok) {
        console.error('查詢註冊狀態失敗:', response.status, response.statusText)
        return false
      }
      // 防止收到 HTML（例如 404/錯誤頁）導致 JSON 解析失敗
      const contentType = response.headers.get('content-type') || ''
      if (!contentType.toLowerCase().includes('application/json')) {
        console.error('查詢註冊狀態失敗: 非 JSON 響應', contentType)
        return false
      }
      const data = await response.json()
      return !!(data && (data as any).registered)
    } catch (error) {
      console.error('查詢註冊狀態失敗或逾時:', error)
      return false
    }
  }

  /**
   * 刪除用戶帳號及所有相關資料
   */
  static async deleteAccount(lineUserId: string): Promise<boolean> {
    try {
      const baseUrl = this.resolveBaseUrl()
      console.log('[UserService] 刪除帳號，LINE User ID:', lineUserId)
      
      const response = await fetch(`${baseUrl}/api/users/delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lineUserId: lineUserId
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('刪除帳號失敗:', response.status, response.statusText, errorText)
        throw new Error(`刪除帳號失敗: ${response.statusText}`)
      }

      const result = await response.json()
      console.log('帳號刪除成功:', result)
      return true
    } catch (error) {
      console.error('刪除帳號失敗:', error)
      throw error
    }
  }
}
