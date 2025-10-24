"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { 
  BellIcon, 
  UserIcon, 
  ClipboardIcon, 
  LinkIcon,
  ClockIcon,
  AlertTriangleIcon
} from "./icons"
import type { Course } from "@/types/course"

// 學生類型定義
interface Student {
  id: string
  name: string
  email: string
  avatar?: string
  lineConnected: boolean
  lineUserId?: string
  submissionRate: number
  lastActive: string
}

// 作業類型定義
interface Assignment {
  id: string
  title: string
  description: string
  dueDate: string
  submissionRate: number
  totalStudents: number
  submittedCount: number
  status: 'active' | 'overdue' | 'completed'
  createdAt: string
}

// LINE群組類型定義
interface LineGroup {
  id: string
  name: string
  memberCount: number
  isConnected: boolean
  groupId?: string
  inviteLink?: string
}

interface TeacherCourseDetailProps {
  course: Course
  onBack: () => void
  onRemindStudents: (assignmentId?: string) => void
  onManageLineGroup: (groupId: string) => void
  onUnlinkLineGroup: (groupId: string) => void
}

export function TeacherCourseDetail({
  course,
  onBack,
  onRemindStudents,
  onManageLineGroup,
  onUnlinkLineGroup
}: TeacherCourseDetailProps) {
  const [activeTab, setActiveTab] = useState("students")

  // 模擬學生數據
  const students: Student[] = [
    {
      id: "1",
      name: "王小明",
      email: "wang@example.com",
      lineConnected: true,
      lineUserId: "U123456789",
      submissionRate: 85,
      lastActive: "2024-01-15"
    },
    {
      id: "2", 
      name: "李小華",
      email: "li@example.com",
      lineConnected: false,
      submissionRate: 60,
      lastActive: "2024-01-14"
    },
    {
      id: "3",
      name: "張小美",
      email: "zhang@example.com", 
      lineConnected: true,
      lineUserId: "U987654321",
      submissionRate: 95,
      lastActive: "2024-01-15"
    }
  ]

  // 模擬作業數據
  const assignments: Assignment[] = [
    {
      id: "1",
      title: "第一章作業",
      description: "完成課本第一章練習題",
      dueDate: "2024-01-20",
      submissionRate: 75,
      totalStudents: 30,
      submittedCount: 23,
      status: "active",
      createdAt: "2024-01-10"
    },
    {
      id: "2",
      title: "期中報告",
      description: "撰寫期中專題報告",
      dueDate: "2024-01-18",
      submissionRate: 40,
      totalStudents: 30,
      submittedCount: 12,
      status: "overdue",
      createdAt: "2024-01-05"
    }
  ]

  // 模擬LINE群組數據
  const lineGroups: LineGroup[] = [
    {
      id: "1",
      name: "資料結構課程群組",
      memberCount: 25,
      isConnected: true,
      groupId: "C123456789",
      inviteLink: "https://line.me/R/ti/g/abc123"
    },
    {
      id: "2",
      name: "作業討論群",
      memberCount: 18,
      isConnected: true,
      groupId: "C987654321"
    }
  ]

  // 計算統計數據
  const connectedStudents = students.filter(s => s.lineConnected).length
  const averageSubmissionRate = students.reduce((acc, s) => acc + s.submissionRate, 0) / students.length

  return (
    <div className="space-y-6">
      {/* 課程標題和返回按鈕 */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={onBack}>
            ← 返回
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{course.name}</h1>
            <p className="text-muted-foreground">課程代碼: {course.courseCode}</p>
          </div>
        </div>
        <Button 
          onClick={() => onRemindStudents()}
          className="bg-orange-500 hover:bg-orange-600 text-white w-full sm:w-auto"
        >
          <BellIcon className="w-4 h-4 mr-2" />
          一鍵提醒全部
        </Button>
      </div>

      {/* 課程統計卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <UserIcon className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">總學生數</p>
                <p className="text-2xl font-bold">{course.studentCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <LinkIcon className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">LINE已綁定</p>
                <p className="text-2xl font-bold">{connectedStudents}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <ClipboardIcon className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">平均繳交率</p>
                <p className="text-2xl font-bold">{Math.round(averageSubmissionRate)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangleIcon className="w-5 h-5 text-red-500" />
              <div>
                <p className="text-sm text-muted-foreground">逾期作業</p>
                <p className="text-2xl font-bold">{assignments.filter(a => a.status === 'overdue').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 標籤頁內容 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex w-full overflow-x-auto gap-2">
          <TabsTrigger value="students">學生名單</TabsTrigger>
          <TabsTrigger value="assignments">作業列表</TabsTrigger>
          <TabsTrigger value="groups">LINE群組</TabsTrigger>
        </TabsList>

        {/* 學生名單標籤頁 */}
        <TabsContent value="students" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <span>學生名單 ({students.length})</span>
                <div className="flex space-x-2">
                  <Badge variant="outline">
                    已綁定LINE: {connectedStudents}
                  </Badge>
                  <Badge variant="outline">
                    未綁定: {students.length - connectedStudents}
                  </Badge>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {students.map((student) => (
                  <div key={student.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <Avatar>
                        <AvatarImage src={student.avatar} />
                        <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-medium">{student.name}</h3>
                        <p className="text-sm text-muted-foreground">{student.email}</p>
                        <p className="text-xs text-muted-foreground">最後活動: {student.lastActive}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm font-medium">繳交率</p>
                        <div className="flex items-center space-x-2">
                          <Progress value={student.submissionRate} className="w-20" />
                          <span className="text-sm">{student.submissionRate}%</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {student.lineConnected ? (
                          <Badge variant="default" className="bg-green-500">
                            <LinkIcon className="w-3 h-3 mr-1" />
                            已綁定LINE
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <AlertTriangleIcon className="w-3 h-3 mr-1" />
                            未綁定LINE
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 作業列表標籤頁 */}
        <TabsContent value="assignments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>作業列表 ({assignments.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {assignments.map((assignment) => (
                  <div key={assignment.id} className="p-4 border rounded-lg">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-medium">{assignment.title}</h3>
                          <Badge 
                            variant={assignment.status === 'overdue' ? 'destructive' : 'default'}
                            className={assignment.status === 'active' ? 'bg-orange-500' : ''}
                          >
                            {assignment.status === 'overdue' ? '已逾期' : 
                             assignment.status === 'active' ? '進行中' : '已完成'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{assignment.description}</p>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <ClockIcon className="w-4 h-4" />
                            <span>截止: {assignment.dueDate}</span>
                          </div>
                          <div>
                            繳交: {assignment.submittedCount}/{assignment.totalStudents}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end space-y-2">
                        <div className="text-right">
                          <p className="text-sm font-medium">繳交率</p>
                          <div className="flex items-center space-x-2">
                            <Progress value={assignment.submissionRate} className="w-20" />
                            <span className="text-sm">{assignment.submissionRate}%</span>
                          </div>
                        </div>
                        
                        <Button 
                          size="sm"
                          onClick={() => onRemindStudents(assignment.id)}
                          className="bg-orange-500 hover:bg-orange-600 text-white"
                        >
                          <BellIcon className="w-3 h-3 mr-1" />
                          提醒未繳
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* LINE群組標籤頁 */}
        <TabsContent value="groups" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <span>LINE群組管理</span>
                <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                  <LinkIcon className="w-4 h-4 mr-2" />
                  新增群組
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {lineGroups.map((group) => (
                  <div key={group.id} className="p-4 border rounded-lg">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                          <LinkIcon className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                          <h3 className="font-medium">{group.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            成員數: {group.memberCount}
                          </p>
                          {group.groupId && (
                            <p className="text-xs text-muted-foreground">
                              群組ID: {group.groupId}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Badge 
                          variant={group.isConnected ? "default" : "secondary"}
                          className={group.isConnected ? "bg-green-500" : ""}
                        >
                          {group.isConnected ? "已連接" : "未連接"}
                        </Badge>
                        
                        <div className="flex space-x-1">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => onManageLineGroup(group.id)}
                          >
                            管理
                          </Button>
                          {group.isConnected && (
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => onUnlinkLineGroup(group.id)}
                            >
                              <AlertTriangleIcon className="w-3 h-3 mr-1" />
                              解除綁定
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {group.inviteLink && (
                      <div className="mt-3 p-2 bg-muted rounded text-xs">
                        邀請連結: {group.inviteLink}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}