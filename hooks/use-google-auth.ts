'use client'

import { useState, useCallback } from 'react'
import { ApiService } from '@/services/apiService'
import { getIdToken } from '@/lib/line-liff'
import { 
  openGoogleAuthInLiff, 
  parseGoogleAuthCallback,
  cleanupOAuthParams,
  isLiffEnvironment
} from '@/lib/liff-environment'
import { useLineAuth } from './use-line-auth'

export interface GoogleAuthState {
  isAuthorized: boolean
  isLoading: boolean
  error: string | null
  userEmail: string | null
}

export function useGoogleAuth() {
  const { user: lineUser, isLoggedIn: isLineLoggedIn } = useLineAuth()
  
  const [state, setState] = useState<GoogleAuthState>({
    isAuthorized: false,
    isLoading: false,
    error: null,
    userEmail: null
  })

  const setLoading = (loading: boolean) => {
    setState(prev => ({ ...prev, isLoading: loading }))
  }

  const setError = (error: string | null) => {
    setState(prev => ({ ...prev, error }))
  }

  const setAuthorized = (authorized: boolean, email?: string) => {
    setState(prev => ({ 
      ...prev, 
      isAuthorized: authorized,
      userEmail: email || null
    }))
  }

  const authorize = useCallback(async (payload?: { role?: 'teacher' | 'student'; name?: string }): Promise<string | null> => {
    setLoading(true)
    setError(null)

    try {
      // 確保使用真實的 LINE user ID
      if (isLineLoggedIn && lineUser?.userId) {
        ApiService.setLineUserId(lineUser.userId)
      }
      
      // 1) 如果在 LIFF 且提供 role/name，優先走預註冊流程（需要 id_token + CSRF）
      let resp: any
      const hasRegistrationPayload = !!(payload?.role && payload?.name)
      const canUsePreRegister = isLineLoggedIn && !!lineUser?.userId && hasRegistrationPayload

      if (canUsePreRegister) {
        const idToken = getIdToken()
        if (typeof idToken === 'string' && idToken.trim()) {
          try {
            resp = await ApiService.preRegister({
              id_token: idToken,
              role: payload!.role!,
              name: payload!.name!,
            })
          } catch (e) {
            // 預註冊失敗時，改用直接 OAuth，但仍傳遞用戶數據
            resp = await ApiService.getGoogleOAuthUrl(payload)
          }
        } else {
          // 取不到 id_token 時退回直接 OAuth，但仍傳遞用戶數據
          resp = await ApiService.getGoogleOAuthUrl(payload)
        }
      } else {
        // 2) 其他情況（非 LIFF 或沒有 role/name），走直接 OAuth（csrf_exempt）
        resp = await ApiService.getGoogleOAuthUrl(payload)
      }

      // 若預註冊返回錯誤或未取得連結，嘗試再取一次直接 OAuth 連結
      if (resp?.error) {
        try {
          resp = await ApiService.getGoogleOAuthUrl(payload)
        } catch {}
      }

      // 統一解析可能的欄位名稱：redirectUrl / auth_url / url
      const extractRedirectUrl = (r: any): string => {
        try {
          const d = (r && r.data) ? r.data : r || {}
          const candidate = (d && (d['redirectUrl'] || d['auth_url'] || d['url']))
            || (r && (r['redirectUrl'] || r['auth_url'] || r['url']))
            || ''
          return typeof candidate === 'string' ? candidate : ''
        } catch {
          return ''
        }
      }

      let redirectUrl: string = extractRedirectUrl(resp)
      if (!redirectUrl) {
        try {
          const fallback = await ApiService.getGoogleOAuthUrl()
          redirectUrl = extractRedirectUrl(fallback)
        } catch {}
      }
      if (!redirectUrl) {
        throw new Error('未取得授權連結')
      }

      // 檢查是否已有回調數據（頁面重新載入後）
      const callbackData = parseGoogleAuthCallback()
      if (callbackData.hasCallback) {
        // 清理 URL 參數
        cleanupOAuthParams()
        
        // 儲存用戶數據
        if (callbackData.lineUserId) {
          ApiService.setLineUserId(callbackData.lineUserId)
        }

        const userEmail = callbackData.email || undefined
        setAuthorized(true, userEmail)
        setLoading(false)
        return userEmail ?? null
      }

      // 使用適合的方式開啟授權連結（LIFF 外部或新分頁）
      openGoogleAuthInLiff(redirectUrl)
      // 不再設置 postMessage 或輪詢；成功後由成功頁面與 LIFF deep link 邏輯處理
      setLoading(false)
      return null
    } catch (error) {
      console.error('Google 授權失敗:', error)
      setError('授權過程中發生錯誤')
      setLoading(false)
      throw error
    }
  }, [isLineLoggedIn, lineUser])

  const checkAuthStatus = useCallback(async () => {
    try {
      const response = await ApiService.getGoogleApiStatus()
      if (response.data && (response.data as any).is_connected) {
        const data: any = response.data
        const email = data.account_email || data.email || data.google_email || undefined
        setAuthorized(true, email)
        return true
      }
      return false
    } catch (error) {
      console.error('檢查 Google 授權狀態失敗:', error)
      return false
    }
  }, [])

  const revoke = useCallback(async () => {
    try {
      // 這裡可以加入撤銷授權的 API 呼叫
      setAuthorized(false)
      return true
    } catch (error) {
      console.error('撤銷 Google 授權失敗:', error)
      setError('撤銷授權失敗')
      return false
    }
  }, [])

  return {
    ...state,
    authorize,
    checkAuthStatus,
    revoke,
    setError
  }
}