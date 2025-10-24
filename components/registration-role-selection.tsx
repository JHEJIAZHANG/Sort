'use client'

import { UserRole } from '@/hooks/use-registration-flow'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { GraduationCap, Users, ChevronRight } from 'lucide-react'

interface RoleSelectionProps {
  selectedRole: UserRole | null
  onRoleSelect: (role: UserRole) => void
  onNext: () => void
  canProceed: boolean
}

export function RegistrationRoleSelection({
  selectedRole,
  onRoleSelect,
  onNext,
  canProceed
}: RoleSelectionProps) {
  const roles = [
    {
      id: 'teacher' as UserRole,
      title: '老師',
      description: '管理課程、作業和學生',
      icon: GraduationCap,
      color: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
      selectedColor: 'bg-blue-100 border-blue-400 ring-2 ring-blue-200'
    },
    {
      id: 'student' as UserRole,
      title: '學生',
      description: '查看課程、管理學習進度',
      icon: Users,
      color: 'bg-green-50 border-green-200 hover:bg-green-100',
      selectedColor: 'bg-green-100 border-green-400 ring-2 ring-green-200'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* 標題區域 */}
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center mx-auto">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              歡迎使用課程管理系統
            </h1>
            <p className="text-gray-600">
              請選擇您的身分以開始使用
            </p>
          </div>
        </div>

        {/* 進度指示器 */}
        <div className="flex items-center justify-center space-x-2">
          <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
            1
          </div>
          <div className="w-8 h-1 bg-gray-200 rounded"></div>
          <div className="w-8 h-8 bg-gray-200 text-gray-500 rounded-full flex items-center justify-center text-sm font-medium">
            2
          </div>
          <div className="w-8 h-1 bg-gray-200 rounded"></div>
          <div className="w-8 h-8 bg-gray-200 text-gray-500 rounded-full flex items-center justify-center text-sm font-medium">
            3
          </div>
        </div>

        {/* 身分選擇卡片 */}
        <div className="space-y-4">
          {roles.map((role) => {
            const Icon = role.icon
            const isSelected = selectedRole === role.id
            
            return (
              <Card
                key={role.id}
                className={`cursor-pointer transition-all duration-200 ${
                  isSelected ? role.selectedColor : role.color
                }`}
                onClick={() => onRoleSelect(role.id)}
              >
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      isSelected 
                        ? role.id === 'teacher' ? 'bg-blue-500' : 'bg-green-500'
                        : 'bg-white'
                    }`}>
                      <Icon className={`w-6 h-6 ${
                        isSelected ? 'text-white' : 'text-gray-600'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {role.title}
                      </h3>
                      <p className="text-gray-600 text-sm">
                        {role.description}
                      </p>
                    </div>
                    {isSelected && (
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* 下一步按鈕 */}
        <div className="pt-4">
          <Button
            onClick={onNext}
            disabled={!canProceed}
            className="w-full h-12 text-lg font-medium bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed"
          >
            下一步
            <ChevronRight className="w-5 h-5 ml-2" />
          </Button>
        </div>

        {/* 提示文字 */}
        <div className="text-center">
          <p className="text-sm text-gray-500">
            選擇身分後可以享受個人化的功能體驗
          </p>
        </div>
      </div>
    </div>
  )
}