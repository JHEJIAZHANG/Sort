"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
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

interface TeacherLiffReminderProps {
  assignment?: Assignment
  students: Student[]
  onSendReminder: (
    studentIds: string[], 
    type: ReminderType, 
    message: string
  ) => Promise<void>
  onClose: () => void
}

export function TeacherLiffReminder({
  assignment,
  students,
  onSendReminder,
  onClose
}: TeacherLiffReminderProps) {
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [reminderType, setReminderType] = useState<ReminderType>('both')
  const [customMessage, setCustomMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'select' | 'message' | 'send'>('select')

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

  // 渲染標籤頁內容
  const renderTabContent = () => {
    switch (activeTab) {
      case 'select':
        return (
          <div className="space-y-4">
            {/* 統計資訊 */}
            <div className="grid grid-cols-3 gap-2">
              <Card className="p-3">
                <div className="text-center">
                  <AlertTriangleIcon className="w-6 h-6 text-red-500 mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground">未繳交</p>
                  <p className="text-lg font-bold">{unsubmittedStudents.length}</p>
                </div>
              </Card>
              <Card className="p-3">
                <div className="text-center">
                  <BellIcon className="w-6 h-6 text-green-500 mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground">可LINE</p>
                  <p className="text-lg font-bold">{lineConnectedStudents.length}</p>
                </div>
              </Card>
              <Card className="p-3">
                <div className="text-center">
                  <DocumentIcon className="w-6 h-6 text-blue-500 mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground">僅Email</p>
                  <p className="text-lg font-bold">{emailOnlyStudents.length}</p>
                </div>
              </Card>
            </div>

            {/* 快速選擇按鈕 */}
            <div className="grid grid-cols-2 gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleSelectLineConnected}
                className="text-xs"
              >
                選擇LINE用戶
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleSelectEmailOnly}
                className="text-xs"
              >
                選擇Email用戶
              </Button>
            </div>

            {/* 全選選項 */}
            <div className="flex items-center space-x-2 p-3 bg-muted rounded">
              <Checkbox
                id="select-all"
                checked={selectedStudents.length === unsubmittedStudents.length && unsubmittedStudents.length > 0}
                onCheckedChange={handleSelectAll}
              />
              <Label htmlFor="select-all" className="text-sm font-medium">
                全選 ({unsubmittedStudents.length} 位學生)
              </Label>
            </div>

            {/* 學生列表 */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {unsubmittedStudents.map((student) => (
                <Card key={student.id} className="p-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex items-center space-x-3 flex-1">
                      <Checkbox
                        id={`student-${student.id}`}
                        checked={selectedStudents.includes(student.id)}
                        onCheckedChange={(checked) => handleStudentSelect(student.id, checked as boolean)}
                      />
                      <div className="flex-1">
                        <Label htmlFor={`student-${student.id}`} className="text-sm font-medium">
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

            {/* 底部按鈕 */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                已選擇 {selectedStudents.length} 位學生
              </p>
              <Button 
                onClick={() => setActiveTab('message')}
                disabled={selectedStudents.length === 0}
                className="bg-orange-500 hover:bg-orange-600 text-white w-full sm:w-auto"
              >
                下一步
              </Button>
            </div>
          </div>
        )

      case 'message':
        return (
          <div className="space-y-4">
            {/* 提醒方式選擇 */}
            <Card className="p-4">
              <Label className="text-sm font-medium mb-3 block">提醒方式</Label>
              <RadioGroup value={reminderType} onValueChange={(value) => setReminderType(value as ReminderType)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="both" id="both" />
                  <Label htmlFor="both" className="text-sm">LINE + Email (推薦)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="line" id="line" />
                  <Label htmlFor="line" className="text-sm">僅 LINE 訊息</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="email" id="email" />
                  <Label htmlFor="email" className="text-sm">僅 Email</Label>
                </div>
              </RadioGroup>
            </Card>

            {/* 自訂訊息 */}
            <Card className="p-4">
              <Label htmlFor="custom-message" className="text-sm font-medium mb-2 block">
                自訂提醒訊息 (選填)
              </Label>
              <Textarea
                id="custom-message"
                placeholder={getDefaultMessage()}
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                rows={6}
                className="text-sm"
              />
              <p className="text-xs text-muted-foreground mt-1">
                留空將使用預設訊息
              </p>
            </Card>

            {/* 底部按鈕 */}
            <div className="flex justify-between items-center pt-4 border-t">
              <Button 
                variant="outline"
                onClick={() => setActiveTab('select')}
              >
                上一步
              </Button>
              <Button 
                onClick={() => setActiveTab('send')}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                預覽發送
              </Button>
            </div>
          </div>
        )

      case 'send':
        return (
          <div className="space-y-4">
            {/* 發送預覽 */}
            <Card className="p-4">
              <h3 className="font-medium mb-3">發送預覽</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">選擇學生:</span>
                  <span className="font-medium">{selectedStudents.length} 位</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">提醒方式:</span>
                  <span className="font-medium">
                    {reminderType === 'both' ? 'LINE + Email' : 
                     reminderType === 'line' ? 'LINE' : 'Email'}
                  </span>
                </div>
                {assignment && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">作業:</span>
                    <span className="font-medium">{assignment.title}</span>
                  </div>
                )}
              </div>
            </Card>

            {/* 發送詳情 */}
            <Card className="p-4">
              <h3 className="font-medium mb-3">發送詳情</h3>
              <div className="space-y-2 text-sm">
                {reminderType === 'both' || reminderType === 'line' ? (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">LINE 訊息:</span>
                    <span className="font-medium">
                      {selectedStudents.filter(id => 
                        unsubmittedStudents.find(s => s.id === id)?.lineConnected
                      ).length} 位學生
                    </span>
                  </div>
                ) : null}
                {reminderType === 'both' || reminderType === 'email' ? (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Email:</span>
                    <span className="font-medium">{selectedStudents.length} 位學生</span>
                  </div>
                ) : null}
              </div>
            </Card>

            {/* 訊息預覽 */}
            <Card className="p-4">
              <h3 className="font-medium mb-3">訊息內容</h3>
              <div className="bg-muted p-3 rounded text-xs whitespace-pre-wrap">
                {customMessage.trim() || getDefaultMessage()}
              </div>
            </Card>

            {/* 底部按鈕 */}
            <div className="flex justify-between items-center pt-4 border-t">
              <Button 
                variant="outline"
                onClick={() => setActiveTab('message')}
              >
                上一步
              </Button>
              <Button 
                onClick={handleSendReminder}
                disabled={isLoading}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    發送中...
                  </>
                ) : (
                  <>
                    <BellIcon className="w-4 h-4 mr-2" />
                    確認發送
                  </>
                )}
              </Button>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-background p-4">
      {/* 標題 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-foreground">一鍵提醒</h1>
          {assignment && (
            <p className="text-sm text-muted-foreground">{assignment.title}</p>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          ✕
        </Button>
      </div>

      {/* 進度指示器 */}
      <div className="flex items-center justify-center mb-6">
        <div className="flex items-center space-x-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
            activeTab === 'select' ? 'bg-orange-500 text-white' : 
            ['message', 'send'].includes(activeTab) ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground'
          }`}>
            1
          </div>
          <div className={`w-8 h-1 ${
            ['message', 'send'].includes(activeTab) ? 'bg-green-500' : 'bg-muted'
          }`}></div>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
            activeTab === 'message' ? 'bg-orange-500 text-white' : 
            activeTab === 'send' ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground'
          }`}>
            2
          </div>
          <div className={`w-8 h-1 ${
            activeTab === 'send' ? 'bg-green-500' : 'bg-muted'
          }`}></div>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
            activeTab === 'send' ? 'bg-orange-500 text-white' : 'bg-muted text-muted-foreground'
          }`}>
            3
          </div>
        </div>
      </div>

      {/* 標籤頁內容 */}
      {renderTabContent()}
    </div>
  )
}