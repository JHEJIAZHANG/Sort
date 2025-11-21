import { useState, useEffect } from 'react'
import { ApiService } from '@/services/apiService'
import { 
  initializeLiff, 
  isInLineApp, 
  isLoggedIn, 
  getUserProfile, 
  lineLogin, 
  lineLogout,
  getLineEnvironment,
  getDevelopmentInfo,
  validateLiffConfig
} from '@/lib/line-liff'

interface LineUser {
  userId: string
  displayName: string
  pictureUrl?: string
  statusMessage?: string
}

interface LineAuthState {
  isInitialized: boolean
  isInLineApp: boolean
  isLoggedIn: boolean
  user: LineUser | null
  isLoading: boolean
  error: string | null
}

export const useLineAuth = () => {
  const [state, setState] = useState<LineAuthState>({
    isInitialized: false,
    isInLineApp: false,
    isLoggedIn: false,
    user: null,
    isLoading: true,
    error: null
  })

  // 初始化 LIFF 並在未登入時自動觸發登入
  useEffect(() => {
    const initLiff = async () => {
      try {
        console.log('🔄 useLineAuth: 設置 loading 狀態')
        setState(prev => ({ ...prev, isLoading: true, error: null }))
        // 不再讀寫 localStorage，僅使用記憶體與 LIFF 狀態
        
        console.log('🚀 useLineAuth: 調用 initializeLiff')
        const initialized = await initializeLiff()
        console.log('✅ useLineAuth: initializeLiff 結果:', initialized)
        
        if (initialized) {
          const inLineApp = isInLineApp()
          const loggedIn = isLoggedIn()
          
          console.log('🔍 useLineAuth: 檢查狀態', { inLineApp, loggedIn })

          if (!loggedIn) {
            const configCheck = validateLiffConfig()
            if (inLineApp && configCheck.isValid) {
              setState({
                isInitialized: true,
                isInLineApp: inLineApp,
                isLoggedIn: false,
                user: null,
                isLoading: true,
                error: null
              })
              lineLogin()
              return
            }
            if (!inLineApp) {
              const qs = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
              const hasIdFromUrl = !!(qs && (qs.get('line_user_id') || qs.get('lineUserId')))
              const bootstrapId = ApiService.bootstrapLineUserId()
              const hasIdPersisted = !!bootstrapId
              if (hasIdFromUrl || hasIdPersisted) {
                setState({
                  isInitialized: true,
                  isInLineApp: false,
                  isLoggedIn: false,
                  user: null,
                  isLoading: false,
                  error: null
                })
                return
              }
              try {
                const resp = await ApiService.getLineOAuthUrl()
                const d: any = resp?.data || resp || {}
                const redirectUrl = d.redirectUrl || d.auth_url || d.url || ''
                if (redirectUrl) {
                  window.location.href = redirectUrl
                  return
                }
              } catch {}
            }
            setState({
              isInitialized: true,
              isInLineApp: inLineApp,
              isLoggedIn: false,
              user: null,
              isLoading: false,
              error: configCheck.isValid ? null : `LIFF 配置問題：${configCheck.issues.join(', ')}`
            })
            return
          }
          
          let user: LineUser | null = null
          if (loggedIn) {
            console.log('👤 useLineAuth: 獲取用戶資料')
            user = await getUserProfile()
            console.log('👤 useLineAuth: 用戶資料:', user)
            // 登入後同步真實 lineUserId 至 ApiService（不寫入本地儲存）
            if (user?.userId) {
              ApiService.setLineUserId(user.userId)
            }
          }
          
          console.log('✅ useLineAuth: 設置最終狀態')
          setState({
            isInitialized: true,
            isInLineApp: inLineApp,
            isLoggedIn: loggedIn,
            user,
            isLoading: false,
            error: null
          })
        } else {
          console.log('❌ useLineAuth: 初始化失敗')
          setState(prev => ({
            ...prev,
            isInitialized: false,
            isLoading: false,
            error: 'LIFF 初始化失敗'
          }))
        }
      } catch (error) {
        console.error('💥 useLineAuth: 初始化錯誤:', error)
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : '未知錯誤'
        }))
      }
    }

    initLiff()
  }, [])

  // 登入（保留為備援）
  const login = () => {
    try {
      lineLogin()
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : '登入失敗'
      }))
    }
  }

  // 登出
  const logout = () => {
    try {
      lineLogout()
      setState(prev => ({
        ...prev,
        isLoggedIn: false,
        user: null
      }))
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : '登出失敗'
      }))
    }
  }

  // 重新整理用戶資料
  const refreshUser = async () => {
    try {
      if (isLoggedIn()) {
        const user = await getUserProfile()
        setState(prev => ({ ...prev, user }))
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : '取得用戶資料失敗'
      }))
    }
  }

  // 取得 LINE 環境資訊
  const getEnvironmentInfo = () => {
    return getLineEnvironment()
  }

  // 取得開發環境資訊
  const getDevInfo = () => {
    return getDevelopmentInfo()
  }

  // 驗證 LIFF 配置
  const validateConfig = () => {
    return validateLiffConfig()
  }

  return {
    ...state,
    login,
    logout,
    refreshUser,
    getEnvironmentInfo,
    getDevInfo,
    validateConfig
  }
}