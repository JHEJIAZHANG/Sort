'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { parseLiffReturn } from '@/lib/line-liff'
import { UserService } from '@/services/userService'
import { ApiService } from '@/services/apiService'

export default function GoogleAuthSuccessPage() {
  const router = useRouter()
  const [status, setStatus] = useState<'checking' | 'registered' | 'needs_registration'>('checking')

  useEffect(() => {
    const handleAuthSuccess = async () => {
      const params = new URLSearchParams(window.location.search)
      const email = params.get('email') || ''
      const lineUserId = params.get('line_user_id') || ''

      // 若從 LIFF deep link 回來，參數同樣可讀
      const fromLiff = parseLiffReturn()
      const effectiveEmail = email || fromLiff.email || ''
      const effectiveId = lineUserId || fromLiff.lineUserId || ''
      const redirectHint = fromLiff.redirect || ''

      try {
        if (effectiveId) {
          ApiService.setLineUserId(effectiveId)
        }
      } catch {}

      // 若後端標示回到首頁（redirect=/ 或 redirect=home），直接導回首頁，不進入註冊頁邏輯
      if (redirectHint === '/' || redirectHint === 'home') {
        setStatus('registered')
        router.replace('/')
        return
      }

      // 檢查是否有明確的註冊完成標示
      const isRegisteredParam = params.get('registered') === 'true'
      if (isRegisteredParam) {
        setStatus('registered')
        router.replace('/')
        return
      }

      // 檢查用戶是否已完成註冊
      if (effectiveId) {
        try {
          const isRegistered = await UserService.getOnboardStatus(effectiveId)
          if (isRegistered) {
            setStatus('registered')
            router.replace('/')
          } else {
            setStatus('needs_registration')
            router.replace('/registration')
          }
        } catch (error) {
          console.error('檢查註冊狀態失敗:', error)
          setStatus('needs_registration')
          router.replace('/registration')
        }
      } else {
        setStatus('needs_registration')
        router.replace('/registration')
      }
    }

    handleAuthSuccess()
  }, [router])

  const getStatusMessage = () => {
    switch (status) {
      case 'checking':
        return '正在檢查註冊狀態...'
      case 'registered':
        return '授權完成，正在跳轉到主頁...'
      case 'needs_registration':
        return '授權完成，正在跳轉到註冊頁...'
      default:
        return '處理中...'
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-50">
      <div className="text-center">
        <div className="text-6xl mb-4">✅</div>
        <h1 className="text-2xl font-bold text-green-800 mb-2">
          授權成功！
        </h1>
        <p className="text-green-600">
          {getStatusMessage()}
        </p>
      </div>
    </div>
  )
}