"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Progress } from "@/components/ui/progress"
import { 
  BellIcon, 
  UserIcon,
  ClockIcon,
  AlertTriangleIcon,
  DocumentIcon
} from "./icons"

// 學生類型定義
interface Student {
  id: string
  name: string
  email: string
  lineConnected: boolean
  hasSubmitted: boolean
  submissionDate?: string
}

// 作業類型定義
interface Assignment {
  id: string
  title: string
  dueDate: string
  description: string
}

// 提醒類型
type ReminderType = 'line' | 'email' | 'both'

interface TeacherReminderProps {
  assignment?: Assignment
  students: Student[]
  onSendReminder: (
    studentIds: string[], 
    type: ReminderType, 
    message: string
  ) => Promise<void>
  onClose: () => void
}

export function TeacherReminder({
  assignment,
  students,
  onSendReminder,
  onClose
}: TeacherReminderProps) {
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [reminderType, setReminderType] = useState<ReminderType>('both')
  const [customMessage, setCustomMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // 篩選未繳交的學生
  const unsubmittedStudents = students.filter(student => !student.hasSubmitted)
  
  // 篩選有LINE綁定的學生
  const lineConnectedStudents = unsubmittedStudents.filter(student => student.lineConnected)
  
  // 篩選沒有LINE綁定的學生
  const emailOnlyStudents = unsubmittedStudents.filter(student => !student.lineConnected)

  // 預設提醒訊息
  const getDefaultMessage = () => {
    if (assignment) {
      return `親愛的同學，您好！\n\n提醒您「${assignment.title}」作業尚未繳交，截止日期為 ${assignment.dueDate}。\n\n請盡快完成並繳交作業，如有任何問題請隨時聯繫老師。\n\n謝謝！`
    }
    return '親愛的同學，您好！\n\n提醒您有作業尚未繳交，請盡快完成。\n\n謝謝！'
  }

  // 處理學生選擇
  const handleStudentSelect = (studentId: string, checked: boolean) => {
    if (checked) {
      setSelectedStudents(prev => [...prev, studentId])
    } else {
      setSelectedStudents(prev => prev.filter(id => id !== studentId))
    }
  }

  // 全選/取消全選
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedStudents(unsubmittedStudents.map(s => s.id))
    } else {
      setSelectedStudents([])
    }
  }

  // 快速選擇有LINE的學生
  const handleSelectLineConnected = () => {
    setSelectedStudents(lineConnectedStudents.map(s => s.id))
    setReminderType('line')
  }

  // 快速選擇只有Email的學生
  const handleSelectEmailOnly = () => {
    setSelectedStudents(emailOnlyStudents.map(s => s.id))
    setReminderType('email')
  }

  // 發送提醒
  const handleSendReminder = async () => {
    if (selectedStudents.length === 0) {
      alert('請選擇要提醒的學生')
      return
    }

    const message = customMessage.trim() || getDefaultMessage()
    
    setIsLoading(true)
    try {
      await onSendReminder(selectedStudents, reminderType, message)
      alert('提醒已發送成功！')
      onClose()
    } catch (error) {
      alert('發送提醒時發生錯誤，請稍後再試')
      console.error('發送提醒錯誤:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* 標題 */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-foreground">一鍵提醒未繳</h2>
          {assignment && (
            <p className="text-muted-foreground">作業: {assignment.title}</p>
          )}
        </div>
        <Button variant="ghost" onClick={onClose}>
          ✕ 關閉
        </Button>
      </div>

      {/* 統計資訊 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangleIcon className="w-5 h-5 text-red-500" />
              <div>
                <p className="text-sm text-muted-foreground">未繳交學生</p>
                <p className="text-2xl font-bold">{unsubmittedStudents.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <BellIcon className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">可LINE提醒</p>
                <p className="text-2xl font-bold">{lineConnectedStudents.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DocumentIcon className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">僅Email提醒</p>
                <p className="text-2xl font-bold">{emailOnlyStudents.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 學生選擇 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <span>選擇學生 ({selectedStudents.length}/{unsubmittedStudents.length})</span>
              <div className="flex space-x-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={handleSelectLineConnected}
                >
                  選擇LINE用戶
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={handleSelectEmailOnly}
                >
                  選擇Email用戶
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* 全選選項 */}
              <div className="flex items-center space-x-2 p-2 border-b">
                <Checkbox
                  id="select-all"
                  checked={selectedStudents.length === unsubmittedStudents.length && unsubmittedStudents.length > 0}
                  onCheckedChange={handleSelectAll}
                />
                <Label htmlFor="select-all" className="font-medium">
                  全選 ({unsubmittedStudents.length} 位學生)
                </Label>
              </div>

              {/* 學生列表 */}
              <div className="max-h-64 overflow-y-auto space-y-2">
                {unsubmittedStudents.map((student) => (
                  <div key={student.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-2 border rounded">
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id={`student-${student.id}`}
                        checked={selectedStudents.includes(student.id)}
                        onCheckedChange={(checked) => handleStudentSelect(student.id, checked as boolean)}
                      />
                      <div>
                        <Label htmlFor={`student-${student.id}`} className="font-medium">
                          {student.name}
                        </Label>
                        <p className="text-xs text-muted-foreground">{student.email}</p>
                      </div>
                    </div>
                    
                    <div className="flex space-x-1">
                      {student.lineConnected ? (
                        <Badge variant="default" className="bg-green-500">
                          <BellIcon className="w-3 h-3 mr-1" />
                          LINE
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <DocumentIcon className="w-3 h-3 mr-1" />
                          Email
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 提醒設定 */}
        <Card>
          <CardHeader>
            <CardTitle>提醒設定</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 提醒方式選擇 */}
            <div>
              <Label className="text-base font-medium">提醒方式</Label>
              <RadioGroup value={reminderType} onValueChange={(value) => setReminderType(value as ReminderType)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="both" id="both" />
                  <Label htmlFor="both">LINE + Email (推薦)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="line" id="line" />
                  <Label htmlFor="line">僅 LINE 訊息</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="email" id="email" />
                  <Label htmlFor="email">僅 Email</Label>
                </div>
              </RadioGroup>
            </div>

            {/* 自訂訊息 */}
            <div>
              <Label htmlFor="custom-message" className="text-base font-medium">
                自訂提醒訊息 (選填)
              </Label>
              <Textarea
                id="custom-message"
                placeholder={getDefaultMessage()}
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                rows={6}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                留空將使用預設訊息
              </p>
            </div>

            {/* 發送按鈕 */}
            <div className="space-y-3">
              <Button 
                onClick={handleSendReminder}
                disabled={selectedStudents.length === 0 || isLoading}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    發送中...
                  </>
                ) : (
                  <>
                    <BellIcon className="w-4 h-4 mr-2" />
                    發送提醒給 {selectedStudents.length} 位學生
                  </>
                )}
              </Button>
              
              {selectedStudents.length > 0 && (
                <div className="text-sm text-muted-foreground">
                  <p>將發送給:</p>
                  <ul className="list-disc list-inside ml-2">
                    {reminderType === 'both' || reminderType === 'line' ? (
                      <li>LINE 訊息: {selectedStudents.filter(id => 
                        unsubmittedStudents.find(s => s.id === id)?.lineConnected
                      ).length} 位學生</li>
                    ) : null}
                    {reminderType === 'both' || reminderType === 'email' ? (
                      <li>Email: {selectedStudents.length} 位學生</li>
                    ) : null}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}