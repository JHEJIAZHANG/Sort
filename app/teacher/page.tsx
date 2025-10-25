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
import { CourseFilters } from "@/components/course-filters"
import { CourseCard } from "@/components/course-card"
import { UnifiedCalendar } from "@/components/unified-calendar"
import { CourseForm } from "@/components/course-form"
import { TeacherCourseDetail } from "@/components/teacher-course-detail"
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

  // 新增：課程選取切換（與學生端一致的行為）
  const handleCourseSelection = (courseId: string) => {
    const newSelected = new Set(selectedCourseIds)
    if (newSelected.has(courseId)) {
      newSelected.delete(courseId)
    } else {
      newSelected.add(courseId)
    }
    setSelectedCourseIds(newSelected)
  }

  // 新增：Google Classroom 批次匯入
  const handleBulkImport = async (course: Omit<Course, "id" | "createdAt">) => {
    try {
      // Classroom 匯入流程已在子元件完成（confirmImport/設排程/同步作業）
      // 這裡僅重新載入資料即可
      await refetch()
    } catch (error) {
      console.error('匯入課程後刷新失敗:', error)
    }
  }

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

  const classroomCourses = useMemo(() => {
    return courses.filter((c) => c.source === "google_classroom")
  }, [courses])

  const filteredCourses = useMemo(() => {
    const base = classroomCourses
    return base.filter((course) => {
      const matchesSearch = courseSearchQuery === "" || 
        course.name.toLowerCase().includes(courseSearchQuery.toLowerCase()) ||
        (course.instructor && course.instructor.toLowerCase().includes(courseSearchQuery.toLowerCase())) ||
        (course.schedule && course.schedule.some(slot => 
          slot.location && slot.location.toLowerCase().includes(courseSearchQuery.toLowerCase())
        ))

      const matchesDay = courseFilterDay === "all" || 
        (course.schedule && course.schedule.some(slot => 
          slot.dayOfWeek === parseInt(courseFilterDay)
        ))

      return matchesSearch && matchesDay
    })
  }, [classroomCourses, courseSearchQuery, courseFilterDay])

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

  // 取消教師手動新增入口：不再顯示或使用此方法
  const handleAddCourse = () => {
    // 改為開啟 Google Classroom 匯入
    setShowGoogleClassroomImport(true)
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
            courses={classroomCourses}
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
                      // 教師不允許手動新增：改為提示或忽略
                      setShowGoogleClassroomImport(true)
                    }
                    setShowCourseForm(false)
                    setEditingCourse(null)
                    await refetch()
                  }}
                />
              </Card>
            ) : (
              <>
                <PageHeader
                  title="課程管理"
                  subtitle="管理你的所有課程"
                  action={
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCourseView(courseView === "list" ? "calendar" : "list")}
                        className="text-xs sm:text-sm"
                      >
                        {courseView === "list" ? (
                          <CalendarIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                        ) : (
                          <ListIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                        )}
                        <span className="hidden sm:inline">{courseView === "list" ? "月曆視圖" : "列表視圖"}</span>
                        <span className="sm:hidden">{courseView === "list" ? "月曆" : "列表"}</span>
                      </Button>
                      {/* 移除手動新增，改為 Classroom 匯入按鈕 */}
                      <ImportGoogleClassroomButton onImportComplete={() => refetch()} />
                    </>
                  }
                />

                {courses.length > 0 && (
                  <CourseFilters
                    searchQuery={courseSearchQuery}
                    onSearchChange={setCourseSearchQuery}
                    filterDay={courseFilterDay}
                    onFilterDayChange={setCourseFilterDay}
                    totalCount={classroomCourses.length}
                    filteredCount={filteredCourses.length}
                  />
                )}

                <div className="space-y-4">
                  {courses.length > 0 ? (
                    courseView === "list" ? (
                      filteredCourses.length > 0 ? (
                        <div className="space-y-2 sm:space-y-3">
                          {filteredCourses.map((course) => (
                            <div key={course.id} className="relative">
                              {isSelectionMode && (
                                <div className="absolute top-4 left-4 z-10">
                                  <input
                                    type="checkbox"
                                    checked={selectedCourseIds.has(course.id)}
                                    onChange={() => handleCourseSelection(course.id)}
                                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                </div>
                              )}
                              <CourseCard
                                course={course}
                                onClick={() => {
                                  if (isSelectionMode) {
                                    handleCourseSelection(course.id)
                                  } else {
                                    setSelectedCourseId(course.id)
                                  }
                                }}
                                isSelected={isSelectionMode && selectedCourseIds.has(course.id)}
                              />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <Card className="p-4 sm:p-8 text-center">
                          <p className="text-muted-foreground text-sm sm:text-base">沒有符合條件的課程</p>
                        </Card>
                      )
                    ) : (
                      <UnifiedCalendar
                        courses={filteredCourses}
                        onCourseClick={(courseId) => setSelectedCourseId(courseId)}
                      />
                    )
                  ) : (
                    <Card className="p-4 sm:p-8 text-center">
                      <p className="text-muted-foreground mb-4 text-sm sm:text-base">還沒有任何課程</p>
                      {/* 移除手動新增入口，只提供 Classroom 匯入 */}
                      <div className="flex justify-center">
                        <ImportGoogleClassroomButton onImportComplete={() => refetch()} />
                      </div>
                    </Card>
                  )}

                </div>

                <GoogleClassroomImport
                  isOpen={showGoogleClassroomImport}
                  onClose={() => setShowGoogleClassroomImport(false)}
                  onImport={handleBulkImport}
                />

                <Dialog open={!!selectedCourseId} onOpenChange={(open) => { if (!open) setSelectedCourseId(null) }}>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>課程詳情</DialogTitle>
                      <DialogDescription className="sr-only">檢視、編輯或刪除此課程</DialogDescription>
                    </DialogHeader>
                    {selectedCourseId && (
                      <TeacherCourseDetail
                        courseId={selectedCourseId}
                        lineUserId={lineUserId}
                        onClose={() => setSelectedCourseId(null)}
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
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen">
      <div className="lg:grid lg:grid-cols-5 lg:gap-4 xl:gap-6 mb-6 max-w-full overflow-hidden">
        {/* 側邊欄 */}
        <div className="hidden lg:block lg:col-span-1">
          <TeacherSidebarNavigation activeTab={activeTab} onTabChange={handleTabChange} />
        </div>

        {/* 主內容區域 */}
        <div className="lg:col-span-4 px-2 sm:px-4">
          {renderTabContent()}
        </div>
      </div>

      {/* 底部導航（行動版） */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0">
        <TeacherBottomNavigation activeTab={activeTab} onTabChange={handleTabChange} />
      </div>
    </div>
  )
}