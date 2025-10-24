"use client"

import { useState } from "react"
import { TeacherLayout } from "./teacher-layout"
import { TeacherDashboard } from "./teacher-dashboard"
import { TeacherCourseDetail } from "./teacher-course-detail"
import { TeacherWeeklyReport } from "./teacher-weekly-report"
import { TeacherReminder } from "./teacher-reminder"
import { TeacherLiffReminder } from "./teacher-liff-reminder"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { TeacherReminderUnified } from "@/components/teacher-reminder-unified"
import { TeacherStudentManagement } from "./teacher-student-management"

export function TeacherDemo() {
  const [activeTab, setActiveTab] = useState("dashboard")
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null)
  const [showLiffReminder, setShowLiffReminder] = useState(false)


  // 模擬課程數據
  const mockCourses = [
    {
      id: "1",
      name: "資料結構",
      courseCode: "CS101",
      instructor: "張老師",
      studentCount: 30,
      schedule: [],
      color: "#ff9100",
      createdAt: new Date("2024-01-01"),
      source: "manual" as const
    },
    {
      id: "2", 
      name: "演算法",
      courseCode: "CS201",
      instructor: "張老師",
      studentCount: 25,
      schedule: [],
      color: "#ff9100",
      createdAt: new Date("2024-01-01"),
      source: "manual" as const
    }
  ]

  // 處理提醒功能
  const handleSendReminder = (courseId: string, assignmentId?: string) => {
    console.log(`發送提醒 - 課程: ${courseId}, 作業: ${assignmentId || '全部'}`)
    // 這裡可以實現實際的提醒邏輯
  }

  // 處理學生提醒功能（符合TeacherReminder組件的類型）
  const handleStudentReminder = async (studentIds: string[], type: 'line' | 'email' | 'both', message: string) => {
    console.log(`發送學生提醒 - 學生: ${studentIds.join(', ')}, 類型: ${type}, 訊息: ${message}`)
    // 這裡可以實現實際的學生提醒邏輯
  }

  // 處理匯出報告
  const handleExportReport = () => {
    console.log("匯出週報")
    // 這裡可以實現實際的匯出邏輯
  }

  // 處理課程選擇
  const handleCourseSelect = (courseId: string) => {
    setSelectedCourse(courseId)
    setActiveTab("course-detail")
  }

  // 渲染主要內容
  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <TeacherDashboard 
            courses={mockCourses}
            onCourseClick={(course) => handleCourseSelect(course.id)}
            onAddCourse={() => console.log("新增課程")}
            onManageGroups={(courseId) => console.log("管理群組", courseId)}
            onRemindStudents={(courseId) => handleSendReminder(courseId)}
          />
        )
      
      case "courses":
        return (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold">我的課程</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mockCourses.map((course) => (
                <Card key={course.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                      <span>{course.name}</span>
                      <Badge variant="outline">{course.courseCode}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">{course.studentCount} 位學生</p>
                    <Button 
                      onClick={() => handleCourseSelect(course.id)}
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                    >
                      查看詳情
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )

      case "course-detail":
        const selectedCourseData = mockCourses.find(c => c.id === selectedCourse)
        if (!selectedCourseData) {
          return (
            <div className="text-center py-12">
              <p className="text-muted-foreground">請選擇一個課程查看詳情</p>
              <Button 
                onClick={() => setActiveTab("courses")}
                className="mt-4 bg-orange-500 hover:bg-orange-600 text-white"
              >
                返回課程列表
              </Button>
            </div>
          )
        }
        return (
          <TeacherCourseDetail 
            course={selectedCourseData}
            onBack={() => setActiveTab("courses")}
            onRemindStudents={(assignmentId) => handleSendReminder(selectedCourseData.id, assignmentId)}
            onManageLineGroup={(groupId) => console.log("管理LINE群組", groupId)}
            onUnlinkLineGroup={(groupId) => console.log("解除LINE群組", groupId)}
          />
        )

      case "assignments":
        return (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <h1 className="text-2xl font-bold">作業管理</h1>

            </div>
            <Card>
              <CardContent>
                <TeacherReminderUnified 
                  assignment={undefined}
                  students={[]}
                  onSendReminder={handleStudentReminder}
                />
              </CardContent>
            </Card>
          </div>
        )

      case "students":
        return (
          <div className="space-y-6">
            <TeacherStudentManagement />
          </div>
        )

      case "reports":
        return (
          <TeacherWeeklyReport 
            reportData={undefined as any} // 使用組件內的模擬數據
            onSendReminder={handleSendReminder}
            onExportReport={handleExportReport}
          />
        )

      case "profile":
        return (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold">個人資料</h1>
            <Card>
              <CardHeader>
                <CardTitle>教師資訊</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">姓名</label>
                  <p className="text-lg">張老師</p>
                </div>
                <div>
                  <label className="text-sm font-medium">員工編號</label>
                  <p className="text-lg">T001</p>
                </div>
                <div>
                  <label className="text-sm font-medium">電子郵件</label>
                  <p className="text-lg">teacher@example.com</p>
                </div>
                <div>
                  <label className="text-sm font-medium">授課課程數</label>
                  <p className="text-lg">{mockCourses.length} 門課程</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )

      default:
        return (
          <div className="text-center py-12">
            <p className="text-muted-foreground">功能開發中...</p>
          </div>
        )
    }
  }

  return (
    <TeacherLayout 
      currentTab={activeTab}
      onTabChange={setActiveTab}
    >
      {renderContent()}
    </TeacherLayout>
  )
}

export function TeacherDemoCopy() {
  const [activeTab, setActiveTab] = useState("dashboard")
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null)
  const [showLiffReminder, setShowLiffReminder] = useState(false)

  // 模擬課程數據
  const mockCourses = [
    {
      id: "1",
      name: "資料結構",
      courseCode: "CS101",
      instructor: "張老師",
      studentCount: 30,
      schedule: [],
      color: "#ff9100",
      createdAt: new Date("2024-01-01"),
      source: "manual" as const
    },
    {
      id: "2", 
      name: "演算法",
      courseCode: "CS201",
      instructor: "張老師",
      studentCount: 25,
      schedule: [],
      color: "#ff9100",
      createdAt: new Date("2024-01-01"),
      source: "manual" as const
    }
  ]

  // 處理提醒功能
  const handleSendReminder = (courseId: string, assignmentId?: string) => {
    console.log(`發送提醒 - 課程: ${courseId}, 作業: ${assignmentId || '全部'}`)
    // 這裡可以實現實際的提醒邏輯
  }

  // 處理學生提醒功能（符合TeacherReminder組件的類型）
  const handleStudentReminder = async (studentIds: string[], type: 'line' | 'email' | 'both', message: string) => {
    console.log(`發送學生提醒 - 學生: ${studentIds.join(', ')}, 類型: ${type}, 訊息: ${message}`)
    // 這裡可以實現實際的學生提醒邏輯
  }

  // 處理匯出報告
  const handleExportReport = () => {
    console.log("匯出週報")
    // 這裡可以實現實際的匯出邏輯
  }

  // 處理課程選擇
  const handleCourseSelect = (courseId: string) => {
    setSelectedCourse(courseId)
    setActiveTab("course-detail")
  }

  // 渲染主要內容
  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <TeacherDashboard 
            courses={mockCourses}
            onCourseClick={(course) => handleCourseSelect(course.id)}
            onAddCourse={() => console.log("新增課程")}
            onManageGroups={(courseId) => console.log("管理群組", courseId)}
            onRemindStudents={(courseId) => handleSendReminder(courseId)}
          />
        )
      
      case "courses":
        return (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold">我的課程</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mockCourses.map((course) => (
                <Card key={course.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                      <span>{course.name}</span>
                      <Badge variant="outline">{course.courseCode}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">{course.studentCount} 位學生</p>
                    <Button 
                      onClick={() => handleCourseSelect(course.id)}
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                    >
                      查看詳情
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )

      case "course-detail":
        const selectedCourseData = mockCourses.find(c => c.id === selectedCourse)
        if (!selectedCourseData) {
          return (
            <div className="text-center py-12">
              <p className="text-muted-foreground">請選擇一個課程查看詳情</p>
              <Button 
                onClick={() => setActiveTab("courses")}
                className="mt-4 bg-orange-500 hover:bg-orange-600 text-white"
              >
                返回課程列表
              </Button>
            </div>
          )
        }
        return (
          <TeacherCourseDetail 
            course={selectedCourseData}
            onBack={() => setActiveTab("courses")}
            onRemindStudents={(assignmentId) => handleSendReminder(selectedCourseData.id, assignmentId)}
            onManageLineGroup={(groupId) => console.log("管理LINE群組", groupId)}
            onUnlinkLineGroup={(groupId) => console.log("解除LINE群組", groupId)}
          />
        )

      case "assignments":
        return (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <h1 className="text-2xl font-bold">作業管理</h1>
              <div className="space-x-2">
                <Button 
                  onClick={() => setShowLiffReminder(false)}
                  variant={!showLiffReminder ? "default" : "outline"}
                  className={!showLiffReminder ? "bg-orange-500 hover:bg-orange-600 text-white" : ""}
                >
                  桌面版提醒
                </Button>
                <Button 
                  onClick={() => setShowLiffReminder(true)}
                  variant={showLiffReminder ? "default" : "outline"}
                  className={showLiffReminder ? "bg-orange-500 hover:bg-orange-600 text-white" : ""}
                >
                  LIFF版提醒
                </Button>
              </div>
            </div>
            
            {showLiffReminder ? (
              <TeacherLiffReminder 
                assignment={undefined}
                students={[]}
                onSendReminder={handleStudentReminder}
                onClose={() => setActiveTab("dashboard")}
              />
            ) : (
              <TeacherReminder 
                assignment={undefined}
                students={[]}
                onSendReminder={handleStudentReminder}
                onClose={() => setActiveTab("dashboard")}
              />
            )}
          </div>
        )

      case "students":
        return (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold">學生管理</h1>
            <Card>
              <CardContent className="p-6">
                <p className="text-center text-muted-foreground">學生管理功能開發中...</p>
              </CardContent>
            </Card>
          </div>
        )

      case "reports":
        return (
          <TeacherWeeklyReport 
            reportData={undefined as any} // 使用組件內的模擬數據
            onSendReminder={handleSendReminder}
            onExportReport={handleExportReport}
          />
        )

      case "profile":
        return (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold">個人資料</h1>
            <Card>
              <CardHeader>
                <CardTitle>教師資訊</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">姓名</label>
                  <p className="text-lg">張老師</p>
                </div>
                <div>
                  <label className="text-sm font-medium">員工編號</label>
                  <p className="text-lg">T001</p>
                </div>
                <div>
                  <label className="text-sm font-medium">電子郵件</label>
                  <p className="text-lg">teacher@example.com</p>
                </div>
                <div>
                  <label className="text-sm font-medium">授課課程數</label>
                  <p className="text-lg">{mockCourses.length} 門課程</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )

      default:
        return (
          <div className="text-center py-12">
            <p className="text-muted-foreground">功能開發中...</p>
          </div>
        )
    }
  }

  return (
    <TeacherLayout 
      currentTab={activeTab}
      onTabChange={setActiveTab}
    >
      {renderContent()}
    </TeacherLayout>
  )
}

export function TeacherDemoUnifiedPreview() {
  const [activeTab, setActiveTab] = useState("dashboard")
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null)
  const [showLiffReminder, setShowLiffReminder] = useState(false)
  const [showUnifiedReminder, setShowUnifiedReminder] = useState(false)

  const mockStudents = [
    { id: "s1", name: "王小明", email: "ming@example.com", lineConnected: true, hasSubmitted: false },
    { id: "s2", name: "李小華", email: "hua@example.com", lineConnected: false, hasSubmitted: false },
    { id: "s3", name: "陳大同", email: "tong@example.com", lineConnected: true, hasSubmitted: true },
    { id: "s4", name: "林安安", email: "anan@example.com", lineConnected: true, hasSubmitted: false },
  ]

  const mockAssignment = {
    id: "a1",
    title: "週次作業 #5",
    dueDate: "2025-10-31",
    description: "請繳交第5週課程作業。",
  }

  async function handleSendReminder(studentIds: string[], type: 'line' | 'email' | 'both', message: string) {
    console.log("send reminder:", { studentIds, type, message })
    await new Promise(r => setTimeout(r, 1000))
  }

  return (
    <div className="space-y-6">
      {/* ... existing code ... */}

      <Card>
        <CardHeader>
          <CardTitle>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <span>作業管理</span>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => setShowUnifiedReminder(v => !v)} className="w-full sm:w-auto">
                  {showUnifiedReminder ? '關閉提醒' : '開啟提醒'}
                </Button>
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {showUnifiedReminder ? (
            <TeacherReminderUnified 
              assignment={mockAssignment}
              students={mockStudents}
              onSendReminder={handleSendReminder}
              onClose={() => setShowUnifiedReminder(false)}
            />
          ) : (
            <div className="text-muted-foreground">點擊「開啟提醒」以使用統一提醒流程</div>
          )}
        </CardContent>
      </Card>

      {/* ... existing code ... */}
    </div>
  )
}