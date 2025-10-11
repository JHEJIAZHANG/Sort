'use client'

import { useState, useEffect } from 'react'
import { useLineAuth } from './use-line-auth'
import { UserService, UserProfile } from '@/services/userService'

export interface UserAuthState {
  isAuthenticated: boolean
  user: UserProfile | null
  isLoading: boolean
  error: string | null
  needsRegistration: boolean
}

export interface UserAuthOptions {
  skipAutoCheck?: boolean
}

export function useUserAuth(options?: UserAuthOptions) {
  const { isLoggedIn, user: userProfile, isLoading: lineLoading } = useLineAuth()
  const [authState, setAuthState] = useState<UserAuthState>({
    isAuthenticated: false,
    user: null,
    isLoading: true,
    error: null,
    needsRegistration: false
  })

  // 檢查用戶是否已註冊（以 google_refresh_token 是否存在為準）
  const checkUserRegistration = async (lineUserId: string) => {
    try {
      console.log('🔍 [useUserAuth] 開始檢查用戶註冊狀態，LINE User ID:', lineUserId)
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }))

      console.log('📡 [useUserAuth] 調用 API 檢查註冊狀態...')
      const registered = await UserService.getOnboardStatus(lineUserId)
      console.log('📋 [useUserAuth] API 回傳註冊狀態:', registered)
      
      if (registered) {
        console.log('✅ [useUserAuth] 用戶已註冊，獲取詳細資料...')
        // 已註冊則讀取詳細 Profile
        const user = await UserService.getUserByLineId(lineUserId)
        await UserService.recordLogin(lineUserId)
        console.log('👤 [useUserAuth] 用戶資料:', user)
        
        // 檢查用戶角色：只有學生可以進入首頁
        if (user && user.role === 'teacher') {
          console.log('🚫 [useUserAuth] 老師身分無法進入首頁')
          setAuthState({
            isAuthenticated: false,
            user,
            isLoading: false,
            error: '老師身分目前無法使用此應用程式',
            needsRegistration: false
          })
        } else {
          setAuthState({
            isAuthenticated: true,
            user,
            isLoading: false,
            error: null,
            needsRegistration: false
          })
        }
      } else {
        console.log('❌ [useUserAuth] 用戶未註冊，需要進入註冊流程')
        // 未註冊，進入註冊流程
        setAuthState({
          isAuthenticated: false,
          user: null,
          isLoading: false,
          error: null,
          needsRegistration: true
        })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '檢查用戶狀態失敗'
      console.error('💥 [useUserAuth] 檢查用戶註冊狀態時發生錯誤:', error)
      setAuthState({
        isAuthenticated: false,
        user: null,
        isLoading: false,
        error: errorMessage,
        needsRegistration: false
      })
    }
  }

  // 重新檢查用戶狀態
  const refreshUserAuth = async () => {
    if (userProfile?.userId) {
      await checkUserRegistration(userProfile.userId)
    }
  }

  // 登出用戶
  const logout = () => {
    setAuthState({
      isAuthenticated: false,
      user: null,
      isLoading: false,
      error: null,
      needsRegistration: false
    })
  }

  // 當 LINE 登入狀態改變時檢查用戶註冊狀態
  useEffect(() => {
    if (lineLoading) {
      setAuthState(prev => ({ ...prev, isLoading: true }))
      return
    }

    if (!isLoggedIn || !userProfile?.userId) {
      setAuthState({
        isAuthenticated: false,
        user: null,
        isLoading: false,
        error: null,
        needsRegistration: false
      })
      return
    }

    // 在註冊頁面避免重複觸發註冊狀態檢查，交由註冊頁自行處理
    if (options?.skipAutoCheck) {
      setAuthState(prev => ({ ...prev, isLoading: false }))
      return
    }

    checkUserRegistration(userProfile.userId)
  }, [isLoggedIn, userProfile?.userId, lineLoading, options?.skipAutoCheck])

  return {
    ...authState,
    refreshUserAuth,
    logout,
    lineProfile: userProfile
  }
}