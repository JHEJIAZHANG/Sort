'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { useLineAuth } from '@/hooks/use-line-auth'
import { Loader2, LogIn, LogOut, Smartphone, Monitor } from 'lucide-react'

interface LineAuthProps {
  onAuthChange?: (isAuthenticated: boolean, user: any) => void
}

export function LineAuth({ onAuthChange }: LineAuthProps) {
  const { 
    isInitialized, 
    isInLineApp, 
    isLoggedIn, 
    user, 
    isLoading, 
    error, 
    login, 
    logout,
    getEnvironmentInfo
  } = useLineAuth()

  useEffect(() => {
    if (onAuthChange) {
      onAuthChange(isLoggedIn, user)
    }
  }, [isLoggedIn, user, onAuthChange])

  if (isLoading) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>正在初始化 LINE LIFF...</span>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="w-full max-w-md mx-auto border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600">錯誤</CardTitle>
          <CardDescription className="text-red-500">{error}</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (!isInitialized) {
    return (
      <Card className="w-full max-w-md mx-auto border-yellow-200">
        <CardHeader>
          <CardTitle className="text-yellow-600">LIFF 未初始化</CardTitle>
          <CardDescription>
            請確認 LIFF ID 設定正確，或重新整理頁面
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isInLineApp ? (
            <>
              <Smartphone className="h-5 w-5 text-green-600" />
              LINE 應用程式
            </>
          ) : (
            <>
              <Monitor className="h-5 w-5 text-blue-600" />
              網頁瀏覽器
            </>
          )}
        </CardTitle>
        <CardDescription>
          {isInLineApp 
            ? '您正在 LINE 應用程式中使用此服務' 
            : '您正在網頁瀏覽器中使用此服務'
          }
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {isLoggedIn && user ? (
          <div className="space-y-4">
            {/* 用戶資訊 */}
            <div className="flex items-center space-x-3">
              <Avatar>
                <AvatarImage src={user.pictureUrl} alt={user.displayName} />
                <AvatarFallback>
                  {user.displayName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="font-medium">{user.displayName}</h3>
                {user.statusMessage && (
                  <p className="text-sm text-muted-foreground">
                    {user.statusMessage}
                  </p>
                )}
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                已登入
              </Badge>
            </div>

            {/* 登出按鈕 */}
            <Button 
              onClick={logout} 
              variant="outline" 
              className="w-full"
            >
              <LogOut className="h-4 w-4 mr-2" />
              登出
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-muted-foreground mb-4">
                請登入 LINE 帳號以使用完整功能
              </p>
              <Button onClick={login} className="w-full">
                <LogIn className="h-4 w-4 mr-2" />
                使用 LINE 登入
              </Button>
            </div>
          </div>
        )}

        {/* 環境資訊 (開發模式) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium mb-2">開發資訊</h4>
            <div className="text-xs space-y-1 text-gray-600">
              <div>在 LINE 中: {isInLineApp ? '是' : '否'}</div>
              <div>已登入: {isLoggedIn ? '是' : '否'}</div>
              <div>用戶 ID: {user?.userId || '未取得'}</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}