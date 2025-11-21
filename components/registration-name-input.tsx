'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { User, ChevronLeft, ChevronRight, GraduationCap, Users } from 'lucide-react'
import { UserRole } from '@/hooks/use-registration-flow'

interface NameInputProps {
  name: string
  role: UserRole | null
  onNameChange: (name: string) => void
  onNext: () => void
  onPrev: () => void
  canProceed: boolean
}

export function RegistrationNameInput({
  name,
  role,
  onNameChange,
  onNext,
  onPrev,
  canProceed
}: NameInputProps) {
  const [localName, setLocalName] = useState(name)

  const handleNameChange = (value: string) => {
    setLocalName(value)
    onNameChange(value)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && canProceed) {
      onNext()
    }
  }

  const getRoleInfo = () => {
    if (role === 'teacher') {
      return {
        title: '老師',
        icon: GraduationCap,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50'
      }
    } else if (role === 'student') {
      return {
        title: '學生',
        icon: Users,
        color: 'text-green-600',
        bgColor: 'bg-green-50'
      }
    }
    return {
      title: '用戶',
      icon: User,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50'
    }
  }

  const roleInfo = getRoleInfo()
  const RoleIcon = roleInfo.icon

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* 標題區域 */}
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center mx-auto">
            <User className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              請輸入您的姓名
            </h1>
            <p className="text-gray-600">
              讓我們知道如何稱呼您
            </p>
          </div>
        </div>

        {/* 進度指示器 */}
        <div className="flex items-center justify-center space-x-2">
          <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
            ✓
          </div>
          <div className="w-8 h-1 bg-green-500 rounded"></div>
          <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
            2
          </div>
          <div className="w-8 h-1 bg-gray-200 rounded"></div>
          <div className="w-8 h-8 bg-gray-200 text-gray-500 rounded-full flex items-center justify-center text-sm font-medium">
            3
          </div>
        </div>

        {/* 已選身分顯示 */}
        {role && (
          <Card className={`${roleInfo.bgColor} border-0`}>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                  <RoleIcon className={`w-5 h-5 ${roleInfo.color}`} />
                </div>
                <div>
                  <p className="text-sm text-gray-600">已選擇身分</p>
                  <p className={`font-semibold ${roleInfo.color}`}>
                    {roleInfo.title}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 姓名輸入區域 */}
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-base font-medium text-gray-700">
                姓名 *
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="請輸入您的真實姓名"
                value={localName}
                onChange={(e) => handleNameChange(e.target.value)}
                onKeyPress={handleKeyPress}
                className="h-12 text-lg border-2 focus:border-blue-500 focus:ring-blue-200"
                autoFocus
              />
              <p className="text-sm text-gray-500">
                此姓名將用於系統中的身分識別
              </p>
            </div>

            {/* 輸入提示 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center mt-0.5">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">溫馨提醒</p>
                  <p>請輸入您的真實姓名，這將幫助老師和同學更好地認識您。</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 按鈕區域 */}
        <div className="flex space-x-4">
          <Button
            onClick={onPrev}
            variant="outline"
            className="flex-1 h-12 text-lg font-medium border-2"
          >
            <ChevronLeft className="w-5 h-5 mr-2" />
            上一步
          </Button>
          <Button
            onClick={onNext}
            disabled={!canProceed}
            className="flex-1 h-12 text-lg font-medium bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed"
          >
            下一步
            <ChevronRight className="w-5 h-5 ml-2" />
          </Button>
        </div>

        {/* 提示文字 */}
        <div className="text-center">
          <p className="text-sm text-gray-500">
            您的個人資料將受到完善保護
          </p>
        </div>
      </div>
    </div>
  )
}