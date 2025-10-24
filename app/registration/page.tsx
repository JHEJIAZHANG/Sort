'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useRegistrationFlow } from '@/hooks/use-registration-flow'
import { ApiService } from '@/services/apiService'
import { UserService } from '@/services/userService'
import { useLineAuth } from '@/hooks/use-line-auth'
import { useGoogleAuth } from '@/hooks/use-google-auth'
import { RegistrationRoleSelection } from '@/components/registration-role-selection'
import { RegistrationNameInput } from '@/components/registration-name-input'
import { RegistrationGoogleAuth } from '@/components/registration-google-auth'
import { GoogleClassroomOnboarding } from '@/components/google-classroom-onboarding'
import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle, Loader2 } from 'lucide-react'
import { closeLiffWindow, getIdToken } from '@/lib/line-liff'
import { isLiffEnvironment } from '@/lib/liff-environment'
import { Button } from '@/components/ui/button'

export default function RegistrationPage() {
  const router = useRouter()
  const { isLoggedIn, isLoading: lineLoading } = useLineAuth()
  const { authorize: authorizeGoogle, isLoading: googleLoading } = useGoogleAuth()
  const {
    currentStep,
    data,
    isCompleted,
    isLoading,
    error,
    updateData,
    nextStep,
    prevStep,
    completeRegistration,
    completeRegistrationWithEmail,
    canProceedToNext,
    lineUser
  } = useRegistrationFlow()

  // 狀態管理
  const [registrationStatus, setRegistrationStatus] = useState<'checking' | 'not_registered' | 'error'>('checking')
  // 記住最後一次檢查的使用者 ID；避免因初始假 ID 導致永遠停留在註冊頁
  const lastCheckedUidRef = useRef<string>('')
  // 防止重複導航
  const hasNavigatedRef = useRef<boolean>(false)
  // 防止重複檢查註冊狀態
  const isCheckingRef = useRef<boolean>(false)

  // 已註冊使用者導向守衛：若已綁定則離開註冊頁
  const uidMemo = useMemo(() => {
    const uid = lineUser?.userId || ApiService.getLineUserId() || ApiService.bootstrapLineUserId()
    return uid || ''
  }, [lineUser?.userId])

  useEffect(() => {
    const checkRegistration = async () => {
      if (!uidMemo) return
      
      // 只有當使用者 ID 變更時才重新檢查，避免初始假 ID 導致誤判後不再更新
      if (lastCheckedUidRef.current === uidMemo) return
      
      // 防止重複檢查
      if (isCheckingRef.current) return
      isCheckingRef.current = true
      
      lastCheckedUidRef.current = uidMemo

      setRegistrationStatus('checking')
      console.log('檢查註冊狀態，LINE User ID:', uidMemo)

      try {
        // 確保後續 API 請求帶入正確的 LINE 使用者 ID
        try { ApiService.setLineUserId(uidMemo) } catch {}

        const registered = await UserService.getOnboardStatus(uidMemo)

        if (registered) {
          console.log('✅ 用戶已註冊，檢查角色...')
          // 檢查用戶角色
          const userProfile = await UserService.getUserByLineId(uidMemo)
          
          if (userProfile?.role === 'student') {
            console.log('✅ 學生身分，自動跳轉到應用首頁')
            // 防止重複導航
            if (hasNavigatedRef.current) {
              console.log('已執行過導航，跳過')
              return
            }
            hasNavigatedRef.current = true
            
            // 在 LIFF 內直接關閉視窗；一般瀏覽器導回首頁
            try {
              if (isLiffEnvironment()) {
                console.log('LIFF 環境：關閉視窗')
                closeLiffWindow()
              } else {
                console.log('一般瀏覽器：跳轉到首頁')
                router.replace('/')
              }
            } catch {
              console.log('跳轉失敗，使用備用方案')
              router.replace('/')
            }
          } else if (userProfile?.role === 'teacher') {
            console.log('🚫 老師身分，顯示提示訊息')
            setRegistrationStatus('not_registered') // 保持在註冊頁但顯示已註冊狀態
          }
          return
        } else {
          console.log('❌ 用戶未註冊，允許進入註冊流程')
          setRegistrationStatus('not_registered')
        }
      } catch (e) {
        console.error('檢查註冊狀態失敗:', e)
        // 如果檢查失敗，為了安全起見，允許用戶進入註冊流程
        setRegistrationStatus('not_registered')
      } finally {
        isCheckingRef.current = false
      }
    }

    checkRegistration()
  }, [uidMemo, router])





  // Google 授權處理
  const handleGoogleAuth = async () => {
    try {
      const role = data.role ?? undefined
      const name = data.name || ''
      
      // LIFF 環境優先使用預註冊，否則直接取得 OAuth 連結
      let redirectUrl = ''
      if (isLiffEnvironment() && lineUser?.userId && role && name) {
        const idToken = getIdToken()
        const resp = await ApiService.preRegister({
          id_token: idToken || '',
          role: role!,
          name: name!
        })
        const d: any = resp?.data || resp || {}
        redirectUrl = d.redirectUrl || d.auth_url || d.url || ''
      }
      
      if (!redirectUrl) {
        const resp = await ApiService.getGoogleOAuthUrl({ role, name })
        const d: any = resp?.data || resp || {}
        redirectUrl = d.redirectUrl || d.auth_url || d.url || ''
      }
      
      if (!redirectUrl) {
        alert('後端未回傳 redirectUrl')
        return
      }
      
      // 在 LIFF：用外部瀏覽器開啟；非 LIFF：整頁導向
      if (typeof window !== 'undefined' && (window as any).liff?.openWindow) {
        (window as any).liff.openWindow({ url: redirectUrl, external: true })
      } else {
        window.location.href = redirectUrl
      }
      
      // 進入等待授權狀態（僅提示，不做輪詢）
      console.log('已開啟 Google 授權，請完成後返回應用程式')
    } catch (error) {
      console.error('Google 授權失敗:', error)
    }
  }

  const [showOnboarding, setShowOnboarding] = useState(false)

  const handleComplete = async () => {
    const success = await completeRegistration()
    if (success) {
      // 註冊成功後：顯示 Google Classroom 匯入引導
      setShowOnboarding(true)
    }
  }

  const handleOnboardingComplete = () => {
    // 匯入完成後根據角色跳轉到對應頁面
    try {
      if (data.role === 'student') {
        if (isLiffEnvironment()) {
          closeLiffWindow()
        } else {
          router.replace('/')
        }
      } else if (data.role === 'teacher') {
        // 老師身分跳轉到老師頁面
        router.replace('/teacher-demo')
      }
    } catch (e) {
      console.error('跳轉失敗，使用備援方案:', e)
      // 備援方案：根據角色跳轉到對應頁面
      if (data.role === 'teacher') {
        router.replace('/teacher-demo')
      } else {
        router.replace('/')
      }
    }
  }

  const handleOnboardingSkip = () => {
    // 跳過匯入，根據角色決定是否跳轉
    handleOnboardingComplete()
  }

  // 載入中狀態
  if (lineLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500" />
          <p className="text-gray-600">正在初始化...</p>
        </div>
      </div>
    )
  }



  // 檢查狀態載入中
  if (registrationStatus === 'checking') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500" />
          <p className="text-gray-600">正在檢查註冊狀態...</p>
        </div>
      </div>
    )
  }

  // 檢查狀態錯誤
  if (registrationStatus === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-xl">!</span>
              </div>
              <h2 className="text-lg font-semibold text-red-800 mb-2">檢查狀態失敗</h2>
              <p className="text-red-600 text-sm">無法確認註冊狀態，請重新整理頁面</p>
              <Button 
                onClick={() => window.location.reload()}
                className="mt-4"
                variant="outline"
              >
                重新整理
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }



  // 註冊完成後：根據角色決定跳轉頁面
  if (isCompleted) {
    // 防止重複導航
    if (!hasNavigatedRef.current) {
      hasNavigatedRef.current = true
      try {
        if (data.role === 'student') {
          if (isLiffEnvironment()) {
            closeLiffWindow()
          } else {
            router.replace('/')
          }
        } else if (data.role === 'teacher') {
          // 老師身分直接跳轉到老師頁面
          router.replace('/teacher-demo')
        }
      } catch {
        // 備援方案：根據角色跳轉到對應頁面
        if (data.role === 'teacher') {
          router.replace('/teacher-demo')
        } else {
          router.replace('/')
        }
      }
    }
    return null
  }

  // 錯誤狀態
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-xl">!</span>
              </div>
              <h2 className="text-lg font-semibold text-red-800 mb-2">發生錯誤</h2>
              <p className="text-red-600 text-sm">{error}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }



  // 只有在確認未註冊時才顯示註冊流程
  if (registrationStatus === 'not_registered') {
    // 根據當前步驟渲染對應頁面
    switch (currentStep) {
      case 1:
        return (
          <RegistrationRoleSelection
            selectedRole={data.role}
            onRoleSelect={(role) => updateData({ role })}
            onNext={nextStep}
            canProceed={canProceedToNext()}
          />
        )

      case 2:
        return (
          <RegistrationNameInput
            name={data.name}
            role={data.role}
            onNameChange={(name) => updateData({ name })}
            onNext={nextStep}
            onPrev={prevStep}
            canProceed={canProceedToNext()}
          />
        )

      case 3:
        return (
          <RegistrationGoogleAuth
            name={data.name}
            role={data.role}
            googleEmail={data.googleEmail}
            lineUserId={data.lineUserId}
            isLoading={isLoading}
            isGoogleLoading={googleLoading}
            isCompleted={isCompleted}
            onGoogleAuth={handleGoogleAuth}
            onPrev={prevStep}
          />
        )

      default:
        return null
    }
  }

  // 預設返回 null（不應該到達這裡）
  return (
    <>
      <GoogleClassroomOnboarding
        isOpen={showOnboarding}
        onComplete={handleOnboardingComplete}
        onSkip={handleOnboardingSkip}
      />
      {null}
    </>
  )
}