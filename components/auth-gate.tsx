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
  const { isLoading: authLoading, needsRegistration, error, lineProfile, user } = useUserAuth({
    skipAutoCheck: isRegistrationPage
  })
  const { isLoading: lineLoading, isLoggedIn } = useLineAuth()

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
          if (userProfile?.role === 'student') {
            router.replace('/')
          } else if (userProfile?.role === 'teacher') {
            router.replace('/teacher-demo')
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
    if (!isLoggedIn) {
      router.replace('/registration')
      return
    }
    if (needsRegistration) {
      router.replace('/registration')
      return
    }

    // 如果用戶已認證，檢查角色權限
    if (user) {
      const isTeacherPage = pathname.startsWith('/teacher')
      const isStudentPage = !isTeacherPage && pathname !== '/registration'

      if (user.role === 'teacher' && isStudentPage) {
        // 老師試圖訪問學生頁面，導向老師頁面
        router.replace('/teacher-demo')
        return
      }

      if (user.role === 'student' && isTeacherPage) {
        // 學生試圖訪問老師頁面，導向學生首頁
        router.replace('/')
        return
      }
    }
  }, [isRegistrationPage, lineLoading, authLoading, isLoggedIn, needsRegistration, user, pathname, router])

  if (isRegistrationPage) {
    return <>{children}</>
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
