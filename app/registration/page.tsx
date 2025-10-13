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
  const { isLoggedIn, isLoading: lineLoading, login } = useLineAuth()
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
  // 防止重複跳轉
  const hasRedirectedRef = useRef(false)
  // 防止重複檢查
  const isCheckingRef = useRef(false)

  // 已註冊使用者導向守衛：若已綁定則離開註冊頁
  const uidMemo = useMemo(() => {
    const uid = lineUser?.userId || ApiService.getLineUserId() || ApiService.bootstrapLineUserId()
    return uid || ''
  }, [lineUser?.userId])

  useEffect(() => {
    const checkRegistration = async () => {
      // 防止重複執行
      if (!uidMemo || isCheckingRef.current || hasRedirectedRef.current) return
      
      // 只有當使用者 ID 變更時才重新檢查，避免初始假 ID 導致誤判後不再更新
      if (lastCheckedUidRef.current === uidMemo) return
      
      lastCheckedUidRef.current = uidMemo
      isCheckingRef.current = true

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
            // 標記已跳轉，防止重複
            hasRedirectedRef.current = true
            
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
  }, [uidMemo])

  // 直接輸入 /registration 的守衛：未登入則引導登入或返回首頁
  useEffect(() => {
    if (lineLoading || hasRedirectedRef.current) return
    if (!isLoggedIn) {
      console.log('未登入，啟動 LINE 登入流程或回首頁')
      try {
        login()
      } catch (e) {
        console.error('啟動 LINE 登入失敗，導向首頁備援:', e)
        hasRedirectedRef.current = true
        router.replace('/')
      }
    }
  }, [lineLoading, isLoggedIn])



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
    // 匯入完成後根據角色決定是否跳轉
    if (data.role === 'student') {
      try {
        if (isLiffEnvironment()) {
          closeLiffWindow()
        } else {
          router.replace('/')
        }
      } catch (e) {
        console.error('跳轉失敗，使用備援至首頁:', e)
        router.replace('/')
      }
    } else if (data.role === 'teacher') {
      // 老師身分不跳轉，留在註冊頁顯示成功訊息
      console.log('老師註冊完成，不跳轉到首頁')
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



  // 註冊完成後：根據角色決定是否跳轉
  if (isCompleted) {
    if (data.role === 'student') {
      try {
        if (isLiffEnvironment()) {
          closeLiffWindow()
        } else {
          router.replace('/')
        }
      } catch {
        router.replace('/')
      }
      return null
    } else if (data.role === 'teacher') {
      // 老師身分顯示成功訊息但不跳轉
      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
          <div className="text-center space-y-6 max-w-md mx-auto p-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-gray-900">註冊成功！</h2>
              <p className="text-gray-600">請轉回LINE應用程式繼續使用</p>
            </div>
          </div>
        </div>
      )
    }
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

  // 如果 LINE 未登入，顯示說明（在本地可能已跳過授權）
  // 本地略過 LIFF 時，不阻擋註冊流程，讓使用者可直接選擇身分
  if (!isLoggedIn && !lineLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-8 text-center space-y-6">
              <div className="space-y-2">
                <h1 className="text-2xl font-bold text-gray-900">歡迎使用課程管理系統</h1>
                <p className="text-gray-600">正在前往 LINE 授權頁面</p>
              </div>
              
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-blue-600">📱</span>
                    <span className="text-sm font-medium text-blue-800">LINE 登入授權</span>
                  </div>
                  <p className="text-xs text-blue-700">
                    系統會自動為您導向 LINE 登入授權。若未自動跳轉，請從 LINE 內再次開啟此頁，或重新整理。
                  </p>
                </div>
                
                <div className="text-sm text-gray-500">
                  <p>授權後您可以：</p>
                  <ul className="mt-2 space-y-1 text-left">
                    <li>• 接收課程提醒通知</li>
                    <li>• 使用 LINE Bot 功能選單</li>
                    <li>• 同步 Google Classroom</li>
                  </ul>
                </div>
              </div>

              <div className="flex items-center justify-center space-x-2 text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">等待導向至 LINE 授權...</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // 如果 LINE 正在載入，顯示載入狀態
  if (lineLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-8 text-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
              <div className="space-y-2">
                <h2 className="text-lg font-semibold text-gray-900">正在連接 LINE</h2>
                <p className="text-sm text-gray-600">請稍候...</p>
              </div>
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