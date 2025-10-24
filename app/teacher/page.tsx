"use client"

import { useState, useEffect, useMemo } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { TeacherBottomNavigation } from "@/components/teacher-bottom-navigation"
import { TeacherSidebarNavigation } from "@/components/teacher-sidebar-navigation"
import { TeacherDashboard } from "@/components/teacher-dashboard"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { CalendarIcon, ListIcon } from "@/components/icons"
import { AddCourseDropdown } from "@/components/add-course-dropdown"
import { CourseFilters } from "@/components/course-filters"
import { CourseCard } from "@/components/course-card"
import { UnifiedCalendar } from "@/components/unified-calendar"
import { CourseForm } from "@/components/course-form"
import { CourseDetail } from "@/components/course-detail"
import { GoogleClassroomImport } from "@/components/google-classroom-import"
import { ImportGoogleClassroomButton } from "@/components/import-google-classroom-button"
import { useLineAuth } from "@/hooks/use-line-auth"
import { useUserAuth } from "@/hooks/use-user-auth"
import { useCourses } from "@/hooks/use-courses"
import type { Course } from "@/types/course"
import { TeacherStudentManagement } from "@/components/teacher-student-management"
import { ApiService } from "@/services/apiService"

export default function TeacherPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  // 權限檢查 - 確保用戶已註冊且為老師
  const { isAuthenticated, needsRegistration, isLoading: authLoading } = useUserAuth()
  
  // 從 URL 參數獲取初始標籤頁，如果沒有則默認為 "dashboard"
  const initialTab = searchParams.get('tab') || "dashboard"
  const [activeTab, setActiveTab] = useState(initialTab)
  
  // 使用 LINE 認證獲取真實的 user ID
  const { user: lineUser, isLoggedIn: isLineLoggedIn } = useLineAuth()
  const [lineUserId, setLineUserId] = useState<string>("")
  const [user, setUser] = useState<{
    id: string
    name: string
    email: string
    avatar?: string
    isLoggedIn: boolean
  }>({
    id: "",
    name: "",
    email: "",
    avatar: "",
    isLoggedIn: false,
  })
  
  const [showCourseForm, setShowCourseForm] = useState(false)
  const [editingCourse, setEditingCourse] = useState<string | null>(null)
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null)
  const [selectedCourseIds, setSelectedCourseIds] = useState<Set<string>>(new Set())
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [courseView, setCourseView] = useState<"list" | "calendar">("list")
  const [courseSearchQuery, setCourseSearchQuery] = useState("")
  const [courseFilterDay, setCourseFilterDay] = useState<string>("all")
  const [showGoogleClassroomImport, setShowGoogleClassroomImport] = useState(false)
  
  useEffect(() => {
    if (isLineLoggedIn && lineUser?.userId) {
      setLineUserId(lineUser.userId)
      ApiService.setLineUserId(lineUser.userId)
    } else {
      const id = ApiService.bootstrapLineUserId()
      setLineUserId(id)
    }
  }, [isLineLoggedIn, lineUser])

  // 從後端獲取用戶資料
  useEffect(() => {
    if (lineUserId) {
      const fetchUserProfile = async () => {
        try {
          const response = await ApiService.getProfile(lineUserId)
          if (response.data) {
            setUser(prevUser => ({
              ...prevUser,
              name: response.data.name || "",
              email: response.data.email || "",
              isLoggedIn: true
            }))
          }
        } catch (error) {
          console.log('無法獲取用戶資料，使用預設值:', error)
        }
      }
      fetchUserProfile()
    }
  }, [lineUserId])

  // 使用 useCourses hook 獲取課程和作業數據
  const {
    courses,
    assignments,
    loading,
    error,
    addCourse,
    updateCourse,
    deleteCourse,
    getCourseById,
    refetch
  } = useCourses(lineUserId)

  const filteredCourses = useMemo(() => {
    const query = courseSearchQuery.trim().toLowerCase()
    const day = courseFilterDay
    return courses.filter((course) => {
      const matchesQuery =
        query === "" ||
        course.name.toLowerCase().includes(query) ||
        (course.description || "").toLowerCase().includes(query)
      const matchDay =
        day === "all" ||
        (Array.isArray(course.daysOfWeek) && course.daysOfWeek.includes(day)) ||
        (!Array.isArray(course.daysOfWeek) && (course as any).dayOfWeek === day)
      return matchesQuery && matchDay
    })
  }, [courses, courseSearchQuery, courseFilterDay])

  // 權限檢查 - 重定向未註冊用戶
  useEffect(() => {
    if (authLoading) {
      console.log('🔄 正在檢查用戶認證狀態...')
      return
    }
    
    if (needsRegistration) {
      console.log('❌ 用戶未註冊，自動重定向到註冊頁面')
      router.replace('/registration')
    } else if (isAuthenticated) {
      console.log('✅ 用戶已認證，允許訪問教師頁面')
    }
  }, [authLoading, needsRegistration, isAuthenticated, router])

  // 同步 URL 參數到 activeTab 狀態
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab') || "dashboard"
    if (tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl)
    }
  }, [searchParams])

  // 處理標籤頁切換
  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    const newUrl = new URL(window.location.href)
    newUrl.searchParams.set('tab', tab)
    router.push(newUrl.pathname + newUrl.search)
  }

  // 處理課程點擊
  const handleCourseClick = (course: Course) => {
    setSelectedCourseId(course.id)
  }

  // 處理新增課程
  const handleAddCourse = () => {
    setEditingCourse(null)
    setShowCourseForm(true)
  }

  // 處理群組管理
  const handleManageGroups = (courseId: string) => {
    console.log('管理群組:', courseId)
    // TODO: 打開群組管理頁面
  }

  // 處理一鍵提醒
  const handleRemindStudents = (courseId: string) => {
    console.log('一鍵提醒:', courseId)
    // TODO: 執行提醒功能
  }

  // 如果正在載入認證狀態，顯示載入畫面
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">載入中...</p>
        </div>
      </div>
    )
  }

  // 如果需要註冊，不顯示內容（會被重定向）
  if (needsRegistration) {
    return null
  }

  // 渲染不同的標籤頁內容
  const renderTabContent = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <TeacherDashboard
            courses={courses}
            assignments={assignments}
            onCourseClick={handleCourseClick}
            onAddCourse={handleAddCourse}
            onManageGroups={handleManageGroups}
            onRemindStudents={handleRemindStudents}
            user={user}
          />
        )
      case "courses":
        return (
          <div className="space-y-6">
            {showCourseForm ? (
              <Card className="p-4 sm:p-6">
                <CourseForm
                  initialCourse={editingCourse ? getCourseById(editingCourse) || undefined : undefined}
                  onCancel={() => { setShowCourseForm(false); setEditingCourse(null) }}
                  onSubmit={async (values) => {
                    if (editingCourse) {
                      await updateCourse(editingCourse, values)
                    } else {
                      await addCourse(values)
                    }
                    setShowCourseForm(false)
                    setEditingCourse(null)
                    await refetch()
                  }}
                />
              </Card>
            ) : (
              <>
                {courses.length > 0 && (
                  <CourseFilters
                    searchQuery={courseSearchQuery}
                    onSearchChange={setCourseSearchQuery}
                    selectedDay={courseFilterDay}
                    onDayChange={setCourseFilterDay}
                  />
                )}
                {courseView === "list" ? (
                  <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredCourses.map((course) => (
                      <CourseCard
                        key={course.id}
                        course={course}
                        showCheckbox={isSelectionMode}
                        isSelected={selectedCourseIds.has(course.id)}
                        onClick={() => setSelectedCourseId(course.id)}
                        onEdit={() => { setEditingCourse(course.id); setShowCourseForm(true) }}
                      />
                    ))}
                  </div>
                ) : (
                  <UnifiedCalendar
                    courses={filteredCourses}
                    assignments={assignments}
                    onCourseSelect={(c) => setSelectedCourseId(c.id)}
                  />
                )}
                <div className="mt-4">
                  <ImportGoogleClassroomButton onImportComplete={() => refetch()} />
                </div>
                <Dialog open={!!selectedCourseId} onOpenChange={(open) => { if (!open) setSelectedCourseId(null) }}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>課程詳情</DialogTitle>
                      <DialogDescription>查看課程資訊與作業</DialogDescription>
                    </DialogHeader>
                    {selectedCourseId && (
                <CourseDetail
                  courseId={selectedCourseId}
                  lineUserId={lineUserId}
                  showBackButton={false}
                />
              )}
                  </DialogContent>
                </Dialog>

              </>
            )}
          </div>
        )
      case "assignments":
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground">作業管理</h1>
              <p className="text-muted-foreground">管理所有課程的作業</p>
            </div>
            {/* TODO: 作業管理組件 */}
            <div className="text-center py-12">
              <p className="text-muted-foreground">作業管理功能開發中...</p>
            </div>
          </div>
        )
      case "students":
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground">學生管理</h1>
              <p className="text-muted-foreground">管理學生名單和LINE綁定</p>
            </div>
            <TeacherStudentManagement />
          </div>
        )
      case "reports":
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground">週報統計</h1>
              <p className="text-muted-foreground">查看繳交率和缺交統計</p>
            </div>
            {/* TODO: 週報統計組件 */}
            <div className="text-center py-12">
              <p className="text-muted-foreground">週報統計功能開發中...</p>
            </div>
          </div>
        )
      case "profile":
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground">個人設定</h1>
              <p className="text-muted-foreground">管理您的個人資料和偏好設定</p>
            </div>
            {/* TODO: 個人設定組件 */}
            <div className="text-center py-12">
              <p className="text-muted-foreground">個人設定功能開發中...</p>
            </div>
          </div>
        )
      default:
        return (
          <TeacherDashboard
            courses={courses}
            assignments={assignments}
            onCourseClick={handleCourseClick}
            onAddCourse={handleAddCourse}
            onManageGroups={handleManageGroups}
            onRemindStudents={handleRemindStudents}
            user={user}
          />
        )
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* 桌面版側邊欄 */}
      <TeacherSidebarNavigation activeTab={activeTab} onTabChange={handleTabChange} />
      
      {/* 主要內容區域 */}
      <main className="lg:ml-16 min-h-screen">
        {/* 頁面標題 */}
        <PageHeader
          title={
            activeTab === "dashboard" ? "首頁" :
            activeTab === "courses" ? (showCourseForm ? (editingCourse ? "編輯課程" : "新增課程") : "我的課程") :
            activeTab === "assignments" ? "作業管理" :
            activeTab === "students" ? "學生管理" :
            activeTab === "reports" ? "週報統計" : "個人設定"
          }
          subtitle={activeTab === "courses" && !showCourseForm ? "管理您的所有課程" : undefined}
          action={
            activeTab === "courses" && !showCourseForm ? (
              <>
                <Button
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => setCourseView(courseView === "list" ? "calendar" : "list")}
                >
                  {courseView === "list" ? (
                    <>
                      <CalendarIcon className="w-4 h-4 mr-2" />
                      切換月曆視圖
                    </>
                  ) : (
                    <>
                      <ListIcon className="w-4 h-4 mr-2" />
                      切換列表視圖
                    </>
                  )}
                </Button>
                <AddCourseDropdown
                  onManualAdd={() => { setEditingCourse(null); setShowCourseForm(true) }}
                  onGoogleClassroomImport={() => setShowGoogleClassroomImport(true)}
                />
              </>
            ) : undefined
          }
        />
        
        {/* 內容區域 */}
        <div className="p-4 sm:p-6 pb-20 lg:pb-6">
          {renderTabContent()}
        </div>
      </main>

      {/* 手機版底部導航 */}
      <TeacherBottomNavigation activeTab={activeTab} onTabChange={handleTabChange} />
    </div>
  )
}