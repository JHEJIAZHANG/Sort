'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useUserAuth } from '@/hooks/use-user-auth'
import { useLineAuth } from '@/hooks/use-line-auth'
import { UserService } from '@/services/userService'
import { Loader2 } from 'lucide-react'

interface AuthGateProps {
  children: React.ReactNode
}

export function AuthGate({ children }: AuthGateProps) {
  // 本地開發跳過認證（僅在設定 NEXT_PUBLIC_SKIP_AUTH=true 時生效）
  const skipAuth = process.env.NEXT_PUBLIC_SKIP_AUTH === 'true'
  if (skipAuth) {
    return <>{children}</>
  }

  const pathname = usePathname()
  const router = useRouter()
  const isRegistrationPage = pathname === '/registration'
  const { isLoading: authLoading, needsRegistration, error, lineProfile, user } = useUserAuth({
    skipAutoCheck: isRegistrationPage
  })
  const { isLoading: lineLoading, isLoggedIn } = useLineAuth()
  const [isRedirecting, setIsRedirecting] = useState(false)

  // 註冊頁的快速守衛：若已註冊則檢查角色並導向對應頁面
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
          // 檢查用戶角色並導向對應頁面
          const userProfile = await UserService.getUserByLineId(uid)
          console.log('[AuthGate] 註冊頁檢查用戶角色:', userProfile?.role)
          if (userProfile?.role === 'student') {
            setIsRedirecting(true)
            router.replace('/')
          } else if (userProfile?.role === 'teacher') {
            setIsRedirecting(true)
            router.replace('/teacher')
          }
        }
      } catch {
        // 忽略錯誤，交由註冊頁自身邏輯處理
      }
    })()
  }, [isRegistrationPage, lineLoading, isLoggedIn, lineProfile?.userId, router])

  // 角色基礎的頁面訪問控制
  useEffect(() => {
    if (isRegistrationPage) return
    if (lineLoading || authLoading) return
    if (needsRegistration) {
      setIsRedirecting(true)
      router.replace('/registration')
      return
    }

    // 如果用戶已認證，檢查角色權限
    if (user) {
      console.log('[AuthGate] 檢查用戶角色:', user.role, '當前路徑:', pathname)
      
      const isTeacherPage = pathname.startsWith('/teacher')
      const isStudentPage = !isTeacherPage && pathname !== '/registration'

      if (user.role === 'teacher' && isStudentPage) {
        // 老師試圖訪問學生頁面，導向老師頁面
        console.log('[AuthGate] 老師訪問學生頁面，重定向到 /teacher')
        setIsRedirecting(true)
        router.replace('/teacher')
        return
      }

      if (user.role === 'student' && isTeacherPage) {
        // 學生試圖訪問老師頁面，導向學生首頁
        console.log('[AuthGate] 學生訪問老師頁面，重定向到 /')
        setIsRedirecting(true)
        router.replace('/')
        return
      }
      
      console.log('[AuthGate] 角色權限檢查通過')
      // 檢查通過且不需要重定向，確保關閉跳轉載入狀態
      if (isRedirecting) setIsRedirecting(false)
    }
  }, [isRegistrationPage, lineLoading, authLoading, isLoggedIn, needsRegistration, user, pathname, router])

  if (isRegistrationPage) {
    return <>{children}</>
  }

  if (lineLoading || authLoading || isRedirecting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500" />
          <p className="text-gray-600">
            {isRedirecting ? '正在跳轉...' : '正在驗證您的使用資格，請稍候…'}
          </p>
        </div>
      </div>
    )
  }

  if (!needsRegistration) {
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
