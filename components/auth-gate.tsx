'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useUserAuth } from '@/hooks/use-user-auth'
import { useLineAuth } from '@/hooks/use-line-auth'
import { UserService } from '@/services/userService'
import { Loader2 } from 'lucide-react'

interface AuthGateProps {
  children: React.ReactNode
}

export function AuthGate({ children }: AuthGateProps) {
  const pathname = usePathname()
  const router = useRouter()
  const isRegistrationPage = pathname === '/registration'
  const { isLoading: authLoading, needsRegistration, error, lineProfile } = useUserAuth({
    skipAutoCheck: isRegistrationPage
  })
  const { isLoading: lineLoading, isLoggedIn } = useLineAuth()

  // 註冊頁的快速守衛：若已註冊則檢查角色
  useEffect(() => {
    if (!isRegistrationPage) return
    if (lineLoading) return
    if (!isLoggedIn) return
    const uid = lineProfile?.userId
    if (!uid) return

    ;(async () => {
      try {
        const registered = await UserService.getOnboardStatus(uid)
        if (registered) {
          // 檢查用戶角色
          const userProfile = await UserService.getUserByLineId(uid)
          if (userProfile?.role === 'student') {
            router.replace('/')
          }
          // 老師身分不導向首頁，留在註冊頁顯示訊息
        }
      } catch {
        // 忽略錯誤，交由註冊頁自身邏輯處理
      }
    })()
  }, [isRegistrationPage, lineLoading, isLoggedIn, lineProfile?.userId, router])

  useEffect(() => {
    if (isRegistrationPage) return

    if (lineLoading || authLoading) return

    // 沒有登入 LINE 視為需註冊
    if (!isLoggedIn) {
      router.replace('/registration')
      return
    }

    if (needsRegistration) {
      router.replace('/registration')
    }
  }, [isRegistrationPage, lineLoading, authLoading, isLoggedIn, needsRegistration, lineProfile?.userId, router])

  if (isRegistrationPage) {
    return <>{children}</>
  }

  // 顯示老師身分錯誤訊息
  if (!lineLoading && !authLoading && isLoggedIn && error && error.includes('老師身分')) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center space-y-6 max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 18.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-gray-900">註冊成功！</h2>
            <p className="text-gray-600">請轉回LINE應用程式繼續使用</p>
          </div>
        </div>
      </div>
    )
  }

  if (!lineLoading && !authLoading && isLoggedIn && !needsRegistration) {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
      <div className="text-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500" />
        <p className="text-gray-600">正在驗證您的使用資格，請稍候…</p>
      </div>
    </div>
  )
}
