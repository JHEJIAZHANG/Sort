'use client'

import { LineLayout } from '@/components/line-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useLineAuth } from '@/hooks/use-line-auth'
import { useRouter } from 'next/navigation'
import { Smartphone, LogOut, Share2, XCircle } from 'lucide-react'
import { closeLiffWindow, shareToLine, parseLiffReturn } from '@/lib/line-liff'
import { useEffect } from 'react'

export default function LiffAppPage() {
  const { isInitialized, isInLineApp, isLoggedIn, user } = useLineAuth()
  const router = useRouter()

  // 若透過 LIFF 深連結帶有 redirect/email/line_user_id，優先導向目標頁
  useEffect(() => {
    try {
      const ret = parseLiffReturn()
      if (ret.redirect) {
        const params = new URLSearchParams()
        if (ret.email) params.set('email', ret.email)
        if (ret.lineUserId) params.set('line_user_id', ret.lineUserId)
        const query = params.toString()
        router.replace(`${ret.redirect}${query ? `?${query}` : ''}`)
      }
    } catch {}
  }, [router])

  return (
    <LineLayout>
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-4">
        <div className="max-w-md mx-auto space-y-6">
          <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-green-600" />
                LIFF 應用介面
              </CardTitle>
              <CardDescription>
                在 LINE 內提供最佳行動體驗
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
            <CardContent className="space-y-4 pt-6">
              <div className="text-sm text-gray-700">
                <div>LIFF 初始化：{isInitialized ? '已完成' : '未完成'}</div>
                <div>位於 LINE 內：{isInLineApp ? '是' : '否'}</div>
                <div>LINE 登入：{isLoggedIn ? '是' : '否'}</div>
                <div>使用者：{user?.displayName || '未知'}</div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button onClick={() => router.push('/line')} className="w-full">
                  返回 LINE 主頁
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => shareToLine(
                    typeof window !== 'undefined' ? window.location.href : '',
                    '一起使用課程管理 LIFF 應用！'
                  )}
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  分享到 LINE
                </Button>
                {isInLineApp && (
                  <Button 
                    variant="destructive" 
                    className="w-full"
                    onClick={() => closeLiffWindow()}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    關閉視窗
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </LineLayout>
  )
}