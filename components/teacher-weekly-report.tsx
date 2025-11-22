"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  BellIcon, 
  UserIcon,
  ClockIcon,
  AlertTriangleIcon,
  DocumentIcon,
  ClipboardIcon
} from "./icons"
import type { Course } from "@/types/course"

// 週報數據類型定義
interface WeeklyReportData {
  weekRange: string
  courses: CourseWeeklyData[]
  overallStats: OverallStats
}

interface CourseWeeklyData {
  course: Course
  assignments: AssignmentWeeklyData[]
  studentStats: StudentWeeklyStats
  submissionTrend: number[]
}

interface AssignmentWeeklyData {
  id: string
  title: string
  dueDate: string
  submissionRate: number
  totalStudents: number
  submittedCount: number
  lateSubmissions: number
  status: 'active' | 'overdue' | 'completed'
}

interface StudentWeeklyStats {
  totalStudents: number
  activeStudents: number
  lineConnectedStudents: number
  averageSubmissionRate: number
  topPerformers: StudentPerformance[]
  strugglingStudents: StudentPerformance[]
}

interface StudentPerformance {
  id: string
  name: string
  email: string
  submissionRate: number
  missedAssignments: number
  lineConnected: boolean
}

interface OverallStats {
  totalCourses: number
  totalStudents: number
  totalAssignments: number
  averageSubmissionRate: number
  overdueAssignments: number
  lineConnectedRate: number
}

interface TeacherWeeklyReportProps {
  reportData: WeeklyReportData
  onSendReminder: (courseId: string, assignmentId?: string) => void
  onExportReport: () => void
}

export function TeacherWeeklyReport({
  reportData,
  onSendReminder,
  onExportReport
}: TeacherWeeklyReportProps) {
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("overview")

  // 模擬週報數據
  const mockReportData: WeeklyReportData = {
    weekRange: "2024年1月15日 - 2024年1月21日",
    overallStats: {
      totalCourses: 3,
      totalStudents: 85,
      totalAssignments: 8,
      averageSubmissionRate: 78,
      overdueAssignments: 2,
      lineConnectedRate: 82
    },
    courses: [
      {
        course: {
          id: "1",
          name: "資料結構",
          courseCode: "CS101",
          instructor: "張老師",
          studentCount: 30,
          schedule: [],
          color: "#ff9100",
          createdAt: new Date("2024-01-01"),
          source: "manual"
        },
        assignments: [
          {
            id: "1",
            title: "第一章作業",
            dueDate: "2024-01-20",
            submissionRate: 85,
            totalStudents: 30,
            submittedCount: 25,
            lateSubmissions: 2,
            status: "active"
          },
          {
            id: "2",
            title: "期中報告",
            dueDate: "2024-01-18",
            submissionRate: 60,
            totalStudents: 30,
            submittedCount: 18,
            lateSubmissions: 5,
            status: "overdue"
          }
        ],
        studentStats: {
          totalStudents: 30,
          activeStudents: 28,
          lineConnectedStudents: 25,
          averageSubmissionRate: 72,
          topPerformers: [
            {
              id: "1",
              name: "王小明",
              email: "wang@example.com",
              submissionRate: 100,
              missedAssignments: 0,
              lineConnected: true
            }
          ],
          strugglingStudents: [
            {
              id: "2",
              name: "李小華",
              email: "li@example.com",
              submissionRate: 40,
              missedAssignments: 3,
              lineConnected: false
            }
          ]
        },
        submissionTrend: [65, 70, 75, 72, 78, 75, 72]
      }
    ]
  }

  const data = reportData || mockReportData

  return (
    <div className="space-y-6">
      {/* 標題和操作 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">週報統計</h1>
          <p className="text-muted-foreground">{data.weekRange}</p>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="outline"
            onClick={onExportReport}
          >
            <DocumentIcon className="w-4 h-4 mr-2" />
            匯出報告
          </Button>
          <Button 
            className="bg-orange-500 hover:bg-orange-600 text-white"
            onClick={() => onSendReminder('all')}
          >
            <BellIcon className="w-4 h-4 mr-2" />
            批量提醒
          </Button>
        </div>
      </div>

      {/* 整體統計 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <ClipboardIcon className="w-6 h-6 text-blue-500 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">總課程數</p>
              <p className="text-2xl font-bold">{data.overallStats.totalCourses}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <UserIcon className="w-6 h-6 text-green-500 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">總學生數</p>
              <p className="text-2xl font-bold">{data.overallStats.totalStudents}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <DocumentIcon className="w-6 h-6 text-purple-500 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">總作業數</p>
              <p className="text-2xl font-bold">{data.overallStats.totalAssignments}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <ClockIcon className="w-6 h-6 text-orange-500 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">平均繳交率</p>
              <p className="text-2xl font-bold">{data.overallStats.averageSubmissionRate}%</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <AlertTriangleIcon className="w-6 h-6 text-red-500 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">逾期作業</p>
              <p className="text-2xl font-bold">{data.overallStats.overdueAssignments}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <BellIcon className="w-6 h-6 text-green-500 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">LINE綁定率</p>
              <p className="text-2xl font-bold">{data.overallStats.lineConnectedRate}%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 標籤頁內容 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex w-full overflow-x-auto gap-2">
          <TabsTrigger value="overview">課程概覽</TabsTrigger>
          <TabsTrigger value="assignments">作業統計</TabsTrigger>
          <TabsTrigger value="students">學生表現</TabsTrigger>
        </TabsList>

        {/* 課程概覽 */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {data.courses.map((courseData) => (
              <Card key={courseData.course.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{courseData.course.name}</h3>
                      <p className="text-sm text-muted-foreground">{courseData.course.courseCode}</p>
                    </div>
                    <Badge variant="outline">
                      {courseData.studentStats.totalStudents} 位學生
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* 課程統計 */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">平均繳交率</p>
                      <div className="flex items-center space-x-2">
                        <Progress value={courseData.studentStats.averageSubmissionRate} className="flex-1" />
                        <span className="text-sm font-medium">{courseData.studentStats.averageSubmissionRate}%</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">LINE綁定</p>
                      <div className="flex items-center space-x-2">
                        <Progress 
                          value={(courseData.studentStats.lineConnectedStudents / courseData.studentStats.totalStudents) * 100} 
                          className="flex-1" 
                        />
                        <span className="text-sm font-medium">
                          {courseData.studentStats.lineConnectedStudents}/{courseData.studentStats.totalStudents}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 作業狀態 */}
                  <div>
                    <p className="text-sm font-medium mb-2">本週作業</p>
                    <div className="space-y-2">
                      {courseData.assignments.map((assignment) => (
                        <div key={assignment.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-2 border rounded">
                          <div className="flex-1">
                            <p className="text-sm font-medium">{assignment.title}</p>
                            <p className="text-xs text-muted-foreground">截止: {assignment.dueDate}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge 
                              variant={assignment.status === 'overdue' ? 'destructive' : 'default'}
                              className={assignment.status === 'active' ? 'bg-orange-500' : ''}
                            >
                              {assignment.submissionRate}%
                            </Badge>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => onSendReminder(courseData.course.id, assignment.id)}
                            >
                              提醒
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* 作業統計 */}
        <TabsContent value="assignments" className="space-y-4">
          {data.courses.map((courseData) => (
            <Card key={courseData.course.id}>
              <CardHeader>
                <CardTitle>{courseData.course.name} - 作業統計</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {courseData.assignments.map((assignment) => (
                    <div key={assignment.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-medium">{assignment.title}</h4>
                          <p className="text-sm text-muted-foreground">截止日期: {assignment.dueDate}</p>
                        </div>
                        <Badge 
                          variant={assignment.status === 'overdue' ? 'destructive' : 'default'}
                          className={assignment.status === 'active' ? 'bg-orange-500' : ''}
                        >
                          {assignment.status === 'active' ? '進行中' : '已結束'}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">繳交率</p>
                          <div className="flex items-center space-x-2">
                            <Progress value={assignment.submissionRate} className="flex-1" />
                            <span className="text-sm font-medium">{assignment.submissionRate}%</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">已繳交</p>
                          <p className="text-lg font-bold">{assignment.submittedCount}/{assignment.totalStudents}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">遲交</p>
                          <p className="text-lg font-bold text-orange-500">{assignment.lateSubmissions}</p>
                        </div>
                        <div className="flex items-end">
                          <Button 
                            size="sm"
                            onClick={() => onSendReminder(courseData.course.id, assignment.id)}
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
          ))}
        </TabsContent>

        {/* 學生表現 */}
        <TabsContent value="students" className="space-y-4">
          {data.courses.map((courseData) => (
            <Card key={courseData.course.id}>
              <CardHeader>
                <CardTitle>{courseData.course.name} - 學生表現</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* 表現優秀學生 */}
                  <div>
                    <h4 className="font-medium mb-3 text-green-600">表現優秀學生</h4>
                    <div className="space-y-2">
                      {courseData.studentStats.topPerformers.map((student) => (
                        <div key={student.id} className="flex items-center justify-between p-3 bg-green-50 rounded">
                          <div className="flex items-center space-x-3">
                            <Avatar className="w-8 h-8">
                              <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium">{student.name}</p>
                              <p className="text-xs text-muted-foreground">{student.email}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-green-600">{student.submissionRate}%</p>
                            <div className="flex items-center space-x-1">
                              {student.lineConnected && (
                                <Badge variant="default" className="bg-green-500 text-xs">LINE</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 需要關注學生 */}
                  <div>
                    <h4 className="font-medium mb-3 text-red-600">需要關注學生</h4>
                    <div className="space-y-2">
                      {courseData.studentStats.strugglingStudents.map((student) => (
                        <div key={student.id} className="flex items-center justify-between p-3 bg-red-50 rounded">
                          <div className="flex items-center space-x-3">
                            <Avatar className="w-8 h-8">
                              <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium">{student.name}</p>
                              <p className="text-xs text-muted-foreground">{student.email}</p>
                              <p className="text-xs text-red-600">缺交 {student.missedAssignments} 次</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-red-600">{student.submissionRate}%</p>
                            <div className="flex items-center space-x-1">
                              {student.lineConnected ? (
                                <Badge variant="default" className="bg-green-500 text-xs">LINE</Badge>
                              ) : (
                                <Badge variant="destructive" className="text-xs">未綁定</Badge>
                              )}
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => onSendReminder(courseData.course.id)}
                                className="text-xs px-2 py-1"
                              >
                                提醒
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  )
}
