'use client'

import { useState, useEffect } from 'react'
import { useLineAuth } from './use-line-auth'
import { UserService } from '@/services/userService'
import { ApiService } from '@/services/apiService'

export type UserRole = 'teacher' | 'student'

export interface RegistrationData {
  role: UserRole | null
  name: string
  googleEmail: string
  lineUserId: string
}

export interface RegistrationFlowState {
  currentStep: number
  data: RegistrationData
  isCompleted: boolean
  isLoading: boolean
  error: string | null
}

export function useRegistrationFlow() {
  const { user: lineUser, isLoggedIn } = useLineAuth()
  
  const [state, setState] = useState<RegistrationFlowState>({
    currentStep: 1,
    data: {
      role: null,
      name: '',
      googleEmail: '',
      // 在正式環境避免預設使用假 ID；僅於本地跳過時回退
      lineUserId: (
        ApiService.getLineUserId() ||
        (process.env.NEXT_PUBLIC_SKIP_LIFF_LOCAL === 'true' ? ApiService.bootstrapLineUserId() : '')
      )
    },
    isCompleted: false,
    isLoading: false,
    error: null
  })

  // 自動設定 LINE User ID
  useEffect(() => {
    if (isLoggedIn && lineUser?.userId) {
      setState(prev => ({
        ...prev,
        data: {
          ...prev.data,
          lineUserId: lineUser.userId
        }
      }))
      // 同步 ApiService 的 lineUserId，供後續 Google OAuth 使用
      ApiService.setLineUserId(lineUser.userId)
    }
  }, [isLoggedIn, lineUser])

  const updateData = (updates: Partial<RegistrationData>) => {
    setState(prev => ({
      ...prev,
      data: {
        ...prev.data,
        ...updates
      }
    }))
  }

  const nextStep = () => {
    setState(prev => ({
      ...prev,
      currentStep: Math.min(prev.currentStep + 1, 3)
    }))
  }

  const prevStep = () => {
    setState(prev => ({
      ...prev,
      currentStep: Math.max(prev.currentStep - 1, 1)
    }))
  }

  const goToStep = (step: number) => {
    setState(prev => ({
      ...prev,
      currentStep: Math.max(1, Math.min(step, 3))
    }))
  }

  const setError = (error: string | null) => {
    setState(prev => ({
      ...prev,
      error
    }))
  }

  const setLoading = (loading: boolean) => {
    setState(prev => ({
      ...prev,
      isLoading: loading
    }))
  }

  const completeRegistration = async () => {
    setLoading(true)
    setError(null)

    try {
      // 驗證必要資料
      const effectiveLineUserId = state.data.lineUserId || ApiService.getLineUserId() || ApiService.bootstrapLineUserId()
      if (!state.data.role || !state.data.name || !effectiveLineUserId) {
        throw new Error('註冊資料不完整')
      }

      // 防重複：只要已完成 Google 綁定（有 refresh token），就視為已註冊
      const alreadyRegistered = await UserService.getOnboardStatus(effectiveLineUserId)
      if (alreadyRegistered) {
        throw new Error('此 LINE 帳號已經註冊過了')
      }

      // 只更新 Profile 的 name 與 role，Google 授權後端在 callback 中寫入
      await ApiService.updateProfile(effectiveLineUserId, {
        name: state.data.name,
        role: state.data.role
      })

      // 發送註冊完成 Flex Message 到 LINE Bot（可選）
      try {
        await UserService.sendRegistrationCompleteMessage(
          effectiveLineUserId,
          state.data.name,
          state.data.role!
        )
      } catch (flexError) {
        console.error('發送 Flex Message 失敗，但註冊已完成基本資料:', flexError)
      }

      setState(prev => ({
        ...prev,
        data: {
          ...prev.data,
          lineUserId: effectiveLineUserId
        },
        isCompleted: true
      }))

      return true
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '註冊失敗'
      setError(errorMessage)
      console.error('註冊失敗:', error)
      return false
    } finally {
      setLoading(false)
    }
  }

  const completeRegistrationWithEmail = async (googleEmail: string) => {
    setLoading(true)
    setError(null)

    try {
      // 驗證必要資料
      const effectiveLineUserId = state.data.lineUserId || ApiService.getLineUserId() || ApiService.bootstrapLineUserId()
      if (!state.data.role || !state.data.name || !effectiveLineUserId) {
        throw new Error('註冊資料不完整')
      }

      const alreadyRegistered = await UserService.getOnboardStatus(effectiveLineUserId)
      if (alreadyRegistered) {
        throw new Error('此 LINE 帳號已經註冊過了')
      }

      // 更新基本資料 + 暫存 email（非必要，後端 callback 也會寫入）
      await ApiService.updateProfile(effectiveLineUserId, {
        name: state.data.name,
        role: state.data.role,
        email: googleEmail
      })

      // 仍保留發送註冊完成 Flex Message
      try {
        await UserService.sendRegistrationCompleteMessage(
          effectiveLineUserId,
          state.data.name,
          state.data.role!
        )
      } catch (flexError) {
        console.error('發送 Flex Message 失敗，但註冊已完成基本資料:', flexError)
      }

      setState(prev => ({
        ...prev,
        data: {
          ...prev.data,
          googleEmail,
          lineUserId: effectiveLineUserId
        },
        isCompleted: true
      }))

      return true
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '註冊失敗'
      setError(errorMessage)
      console.error('註冊失敗:', error)
      return false
    } finally {
      setLoading(false)
    }
  }

  const resetFlow = () => {
    setState({
      currentStep: 1,
      data: {
        role: null,
        name: '',
        googleEmail: '',
        lineUserId: lineUser?.userId || ApiService.getLineUserId() || ApiService.bootstrapLineUserId()
      },
      isCompleted: false,
      isLoading: false,
      error: null
    })
  }

  const canProceedToNext = () => {
    switch (state.currentStep) {
      case 1:
        return state.data.role !== null
      case 2:
        return state.data.name.trim().length > 0
      case 3:
        return state.data.googleEmail.length > 0
      default:
        return false
    }
  }

  return {
    ...state,
    updateData,
    nextStep,
    prevStep,
    goToStep,
    setError,
    setLoading,
    completeRegistration,
    completeRegistrationWithEmail,
    resetFlow,
    canProceedToNext,
    lineUser
  }
}