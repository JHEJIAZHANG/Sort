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
  DocumentIcon,
  AlertTriangleIcon
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

interface TeacherReminderUnifiedProps {
  assignment?: Assignment
  students: Student[]
  onSendReminder: (
    studentIds: string[],
    type: ReminderType,
    message: string
  ) => Promise<void>
  onClose?: () => void
}

export function TeacherReminderUnified({
  assignment,
  students,
  onSendReminder,
  onClose
}: TeacherReminderUnifiedProps) {
  const [activeStep, setActiveStep] = useState<'select' | 'message' | 'send'>('select')
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

  // 學生選擇
  const handleStudentSelect = (studentId: string, checked: boolean) => {
    if (checked) {
      setSelectedStudents(prev => [...prev, studentId])
    } else {
      setSelectedStudents(prev => prev.filter(id => id !== studentId))
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedStudents(unsubmittedStudents.map(s => s.id))
    } else {
      setSelectedStudents([])
    }
  }

  const handleSelectLineConnected = () => {
    setSelectedStudents(lineConnectedStudents.map(s => s.id))
    setReminderType('line')
  }

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
      onClose?.()
    } catch (error) {
      alert('發送提醒時發生錯誤，請稍後再試')
      console.error('發送提醒錯誤:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const stepIndex = activeStep === 'select' ? 0 : activeStep === 'message' ? 1 : 2
  const stepProgress = ((stepIndex + 1) / 3) * 100

  return (
    <div className="space-y-6">
      {/* 標題 + 進度條 */}
      <div className="animate-fade-in">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-foreground">作業提醒</h2>
            {assignment && (
              <p className="text-muted-foreground">作業: {assignment.title}</p>
            )}
          </div>
          {onClose && (
            <Button variant="ghost" onClick={onClose}>✕ 關閉</Button>
          )}
        </div>
        <div className="mt-3">
          <Progress value={stepProgress} className="h-2" />
          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
            <span className={activeStep === 'select' ? 'font-semibold text-foreground' : ''}>選擇學生</span>
            <span>•</span>
            <span className={activeStep === 'message' ? 'font-semibold text-foreground' : ''}>撰寫訊息</span>
            <span>•</span>
            <span className={activeStep === 'send' ? 'font-semibold text-foreground' : ''}>送出提醒</span>
          </div>
        </div>
      </div>

      {/* Step: 選擇學生 */}
      {activeStep === 'select' && (
        <div className="space-y-4 animate-slide-up">
          {/* 統計資訊 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="transition-all duration-300 hover:shadow-lg hover:scale-[1.01]">
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
            <Card className="transition-all duration-300 hover:shadow-lg hover:scale-[1.01]">
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
            <Card className="transition-all duration-300 hover:shadow-lg hover:scale-[1.01]">
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

          {/* 快速選擇 */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <Button size="sm" variant="outline" onClick={handleSelectLineConnected} className="w-full sm:w-auto">
              選擇LINE用戶
            </Button>
            <Button size="sm" variant="outline" onClick={handleSelectEmailOnly} className="w-full sm:w-auto">
              選擇Email用戶
            </Button>
          </div>

          {/* 全選 */}
          <div className="flex items-center space-x-2 p-2 border rounded">
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
          <div className="max-h-72 overflow-y-auto space-y-2">
            {unsubmittedStudents.map((student) => (
              <Card key={student.id} className="p-2 transition-all duration-300 hover:shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex items-center space-x-3 flex-1">
                    <Checkbox
                      id={`student-${student.id}`}
                      checked={selectedStudents.includes(student.id)}
                      onCheckedChange={(checked) => handleStudentSelect(student.id, checked as boolean)}
                    />
                    <div className="flex-1">
                      <Label htmlFor={`student-${student.id}`} className="font-medium">
                        {student.name}
                      </Label>
                      <p className="text-xs text-muted-foreground truncate">{student.email}</p>
                    </div>
                  </div>
                  <Badge 
                    variant={student.lineConnected ? "default" : "secondary"}
                    className={`text-xs ${student.lineConnected ? "bg-green-500" : ""}`}
                  >
                    {student.lineConnected ? "LINE" : "Email"}
                  </Badge>
                </div>
              </Card>
            ))}
          </div>

          {/* 下一步 */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 pt-2">
            <p className="text-sm text-muted-foreground">已選擇 {selectedStudents.length} 位學生</p>
            <Button 
              onClick={() => setActiveStep('message')}
              disabled={selectedStudents.length === 0}
              className="bg-orange-500 hover:bg-orange-600 text-white w-full sm:w-auto"
            >
              下一步
            </Button>
          </div>
        </div>
      )}

      {/* Step: 撰寫訊息 */}
      {activeStep === 'message' && (
        <div className="space-y-6 animate-slide-up">
          <Card>
            <CardHeader>
              <CardTitle>提醒設定</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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

              <div>
                <Label htmlFor="custom-message" className="text-base font-medium">自訂提醒訊息 (選填)</Label>
                <Textarea
                  id="custom-message"
                  placeholder={getDefaultMessage()}
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  rows={6}
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-1">留空將使用預設訊息</p>
              </div>

              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                <Button variant="outline" onClick={() => setActiveStep('select')} className="w-full sm:w-auto">返回選擇</Button>
                <Button onClick={() => setActiveStep('send')} className="bg-orange-500 hover:bg-orange-600 text-white w-full sm:w-auto">預覽與送出</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step: 送出提醒 */}
      {activeStep === 'send' && (
        <div className="space-y-6 animate-slide-up">
          <Card>
            <CardHeader>
              <CardTitle>送出確認</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Card className="p-3 text-center"><p className="text-xs text-muted-foreground">選擇學生</p><p className="text-lg font-bold">{selectedStudents.length}</p></Card>
                <Card className="p-3 text-center"><p className="text-xs text-muted-foreground">提醒方式</p><p className="text-lg font-bold">{reminderType.toUpperCase()}</p></Card>
                <Card className="p-3 text-center"><p className="text-xs text-muted-foreground">訊息長度</p><p className="text-lg font-bold">{(customMessage.trim() || getDefaultMessage()).length}</p></Card>
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">訊息預覽</Label>
                <Card className="p-4 bg-muted whitespace-pre-wrap">
                  {(customMessage.trim() || getDefaultMessage())}
                </Card>
              </div>

              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                <Button variant="outline" onClick={() => setActiveStep('message')} className="w-full sm:w-auto">返回修改</Button>
                <Button 
                  onClick={handleSendReminder}
                  disabled={selectedStudents.length === 0 || isLoading}
                  className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      發送中...
                    </>
                  ) : (
                    <>
                      <BellIcon className="w-4 h-4 mr-2" />
                      發送提醒
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}