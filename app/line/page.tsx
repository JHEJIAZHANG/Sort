'use client'

import { useUserAuth } from '@/hooks/use-user-auth'
import { LineLayout } from '@/components/line-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, BookOpen, FileText, CheckSquare, Share2, Bell, Users, Settings, UserPlus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LinePage() {
  const { 
    isAuthenticated, 
    user, 
    isLoading, 
    error, 
    needsRegistration,
    lineProfile 
  } = useUserAuth()
  const router = useRouter()

  // 如果需要註冊，導向註冊頁面
  const handleRegistration = () => {
    router.push('/registration')
  }

  const features = [
    {
      icon: Calendar,
      title: '課程行事曆',
      description: '查看課程時間表和重要日期',
      href: '/',
      color: 'bg-blue-100 text-blue-600'
    },
    {
      icon: BookOpen,
      title: '課程管理',
      description: '管理您的課程資訊',
      href: '/courses',
      color: 'bg-green-100 text-green-600'
    },
    {
      icon: FileText,
      title: '筆記系統',
      description: '記錄和整理學習筆記',
      href: '/notes',
      color: 'bg-purple-100 text-purple-600'
    },
    {
      icon: CheckSquare,
      title: '作業追蹤',
      description: '追蹤作業進度和截止日期',
      href: '/assignments',
      color: 'bg-orange-100 text-orange-600'
    }
  ]

  return (
    <LineLayout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-md mx-auto space-y-6">
          {/* 歡迎卡片 */}
          <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-800">
                課程管理系統
              </CardTitle>
              <CardDescription className="text-gray-600">
                智能化的課程管理與學習平台
              </CardDescription>
            </CardHeader>
          </Card>

          {/* 載入狀態 */}
          {isLoading && (
            <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
              <CardContent className="pt-6">
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-gray-600">載入中...</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 錯誤狀態 */}
          {error && (
            <Card className="border-0 shadow-lg bg-red-50 border-red-200">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-red-600 font-medium">發生錯誤</p>
                  <p className="text-red-500 text-sm mt-1">{error}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 需要註冊 */}
          {needsRegistration && (
            <Card className="border-0 shadow-lg bg-yellow-50 border-yellow-200">
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <UserPlus className="w-12 h-12 text-yellow-600 mx-auto" />
                  <div>
                    <h3 className="font-semibold text-yellow-800">歡迎新用戶！</h3>
                    <p className="text-yellow-700 text-sm mt-1">
                      請完成註冊以開始使用課程管理系統
                    </p>
                  </div>
                  <Button 
                    onClick={handleRegistration}
                    className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
                  >
                    開始註冊
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 用戶資訊 */}
          {isAuthenticated && user && (
            <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-800">歡迎回來</h3>
                    <p className="text-sm text-gray-600">{user.name}</p>
                    <Badge variant="outline" className="mt-1">
                      {user.role === 'teacher' ? '教師' : '學生'}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <Badge variant="default" className="bg-green-500">
                      已登入
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 功能列表 */}
          {isAuthenticated && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">主要功能</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {features.map((feature, index) => (
                <Link key={index} href={feature.href}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <div className={`p-2 rounded-lg ${feature.color}`}>
                          <feature.icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium">{feature.title}</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {feature.description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* LINE 專用功能 */}
        {isAuthenticated && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Share2 className="h-5 w-5" />
                LINE 專用功能
              </CardTitle>
              <CardDescription>
                在 LINE 中享受更多便利功能
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* 新增：前往 LIFF 應用頁面 */}
              <Button 
                className="w-full justify-start"
                onClick={() => router.push('/liff-app')}
              >
                前往 LIFF 應用
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => {
                  // 這裡可以實作分享功能
                  console.log('分享到 LINE')
                }}
              >
                <Share2 className="h-4 w-4 mr-2" />
                分享給朋友
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => {
                  // 這裡可以實作設定提醒功能
                  console.log('設定 LINE 提醒')
                }}
              >
                <Settings className="h-4 w-4 mr-2" />
                設定 LINE 提醒
              </Button>
            </CardContent>
          </Card>
        )}

        {/* 使用說明 */}
        <Card>
          <CardHeader>
            <CardTitle>使用說明</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
              <p>點擊上方功能卡片進入對應的管理頁面</p>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
              <p>在 LINE 中使用可享受更好的行動體驗</p>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
              <p>所有資料會同步到您的帳號中</p>
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
    </LineLayout>
  )
}