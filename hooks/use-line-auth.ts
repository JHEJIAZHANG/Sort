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
    let isMounted = true // 防止組件卸載後更新狀態
    
    const initLiff = async () => {
      try {
        console.log('🔄 useLineAuth: 設置 loading 狀態')
        if (!isMounted) return
        setState(prev => ({ ...prev, isLoading: true, error: null }))
        // 不再讀寫 localStorage，僅使用記憶體與 LIFF 狀態
        
        console.log('🚀 useLineAuth: 調用 initializeLiff')
        const initialized = await initializeLiff()
        console.log('✅ useLineAuth: initializeLiff 結果:', initialized)
        
        if (!isMounted) return
        
        if (initialized) {
          const inLineApp = isInLineApp()
          const loggedIn = isLoggedIn()
          
          console.log('🔍 useLineAuth: 檢查狀態', { inLineApp, loggedIn })

          // 未登入時自動觸發 LINE 登入（需要正確的 redirectUri 配置）
          if (!loggedIn) {
            const configCheck = validateLiffConfig()
            if (configCheck.isValid) {
              console.log('👉 未登入，自動觸發 LINE 授權導向')
              // 保持 loading 狀態直到導向發生
              if (!isMounted) return
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
            } else {
              console.warn('⚠️ LIFF 配置不正確，無法自動登入', configCheck.issues)
              if (!isMounted) return
              setState({
                isInitialized: true,
                isInLineApp: inLineApp,
                isLoggedIn: false,
                user: null,
                isLoading: false,
                error: `LIFF 配置問題：${configCheck.issues.join(', ')}`
              })
              return
            }
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
          if (!isMounted) return
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
          if (!isMounted) return
          setState(prev => ({
            ...prev,
            isInitialized: false,
            isLoading: false,
            error: 'LIFF 初始化失敗'
          }))
        }
      } catch (error) {
        console.error('💥 useLineAuth: 初始化錯誤:', error)
        if (!isMounted) return
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : '未知錯誤'
        }))
      }
    }

    initLiff()
    
    // Cleanup function
    return () => {
      isMounted = false
    }
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