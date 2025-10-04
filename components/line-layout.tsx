'use client'

import { useEffect, useState } from 'react'
import { useLineAuth } from '@/hooks/use-line-auth'
import { LineAuth } from '@/components/line-auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Share2, MessageCircle, X } from 'lucide-react'
import { closeLiffWindow, sendMessageToLine, shareToLine } from '@/lib/line-liff'

interface LineLayoutProps {
  children: React.ReactNode
  title?: string
  showShareButton?: boolean
  showCloseButton?: boolean
}

export function LineLayout({ 
  children, 
  title = '課程管理系統',
  showShareButton = true,
  showCloseButton = true
}: LineLayoutProps) {
  const { isInitialized, isInLineApp, isLoggedIn, user } = useLineAuth()
  const [showAuthCard, setShowAuthCard] = useState(false)

  useEffect(() => {
    // 如果在 LINE 中但未登入，顯示認證卡片
    if (isInitialized && isInLineApp && !isLoggedIn) {
      setShowAuthCard(true)
    } else {
      setShowAuthCard(false)
    }
  }, [isInitialized, isInLineApp, isLoggedIn])

  const handleShare = () => {
    const url = window.location.href
    const text = `我正在使用 ${title}，一起來看看吧！`
    shareToLine(url, text)
  }

  const handleSendMessage = (message: string) => {
    sendMessageToLine(message)
  }

  const handleClose = () => {
    closeLiffWindow()
  }

  // 如果未初始化，顯示載入中
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">正在載入...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* LINE 專用頂部工具列 */}
      {isInLineApp && (
        <div className="sticky top-0 z-50 bg-white border-b shadow-sm">
          <div className="flex items-center justify-between px-4 py-2">
            <h1 className="font-semibold text-lg truncate">{title}</h1>
            <div className="flex items-center space-x-2">
              {showShareButton && isLoggedIn && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleShare}
                  className="h-8 w-8 p-0"
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              )}
              {showCloseButton && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClose}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 認證卡片 */}
      {showAuthCard && (
        <div className="p-4">
          <LineAuth onAuthChange={(isAuth) => setShowAuthCard(!isAuth)} />
        </div>
      )}

      {/* 主要內容 */}
      <div className={`${isInLineApp ? 'pb-safe' : ''}`}>
        {(!isInLineApp || isLoggedIn) ? (
          children
        ) : (
          <div className="p-4">
            <Card>
              <CardContent className="text-center py-8">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h2 className="text-lg font-semibold mb-2">歡迎使用課程管理系統</h2>
                <p className="text-muted-foreground mb-4">
                  請先登入 LINE 帳號以使用完整功能
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* LINE 專用底部安全區域 */}
      {isInLineApp && (
        <div className="h-safe-bottom bg-white border-t">
          {/* 可以在這裡添加 LINE 專用的底部操作按鈕 */}
        </div>
      )}
    </div>
  )
}

// LINE 專用的頁面包裝器
export function withLineLayout<P extends object>(
  Component: React.ComponentType<P>,
  layoutProps?: Partial<LineLayoutProps>
) {
  return function LineWrappedComponent(props: P) {
    return (
      <LineLayout {...layoutProps}>
        <Component {...props} />
      </LineLayout>
    )
  }
}