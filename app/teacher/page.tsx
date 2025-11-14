"use client"

import { useState, useEffect, useMemo } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { TeacherBottomNavigation } from "@/components/teacher-bottom-navigation"
import { TeacherSidebarNavigation } from "@/components/teacher-sidebar-navigation"
import { TeacherDashboard } from "@/components/teacher-dashboard"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { CalendarIcon, ListIcon, ArrowLeftIcon } from "@/components/icons"
import { CourseFilters } from "@/components/course-filters"
import { CourseCard } from "@/components/course-card"
import { UnifiedCalendar } from "@/components/unified-calendar"
import { CourseForm } from "@/components/course-form"
import { TeacherCourseDetail } from "@/components/teacher-course-detail"
import { ImportTeacherGoogleClassroomButton } from "@/components/import-teacher-google-classroom-button"
import { useLineAuth } from "@/hooks/use-line-auth"
import { useUserAuth } from "@/hooks/use-user-auth"
import { useTeacherCourses } from "@/hooks/use-teacher-courses"
import type { Course } from "@/types/course"
import { TeacherAssignmentManagement } from "@/components/teacher-assignment-management"
import { TeacherAssignmentDetail } from "@/components/teacher-assignment-detail"
import { TeacherProfileContent } from "@/components/teacher-profile-content"
import { ApiService } from "@/services/apiService"
import { Card } from "@/components/ui/card"

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

  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null)
  const [selectedCourseIds, setSelectedCourseIds] = useState<Set<string>>(new Set())
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [courseView, setCourseView] = useState<"list" | "calendar">("list")
  const [courseSearchQuery, setCourseSearchQuery] = useState("")
  const [courseFilterDay, setCourseFilterDay] = useState<string>("all")
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null)
  const [hasActivePro, setHasActivePro] = useState<boolean>(false)

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



  useEffect(() => {
    // 若已透過 LIFF 登入，使用真實的 LINE User ID
    if (isLineLoggedIn && lineUser?.userId) {
      setLineUserId(lineUser.userId)
      ApiService.setLineUserId(lineUser.userId)
      return
    }

    // Fallback：從 URL 或 localStorage 取得 line_user_id（方便在未設定 LIFF 的開發環境下使用）
    try {
      const queryId = searchParams.get('line_user_id') || ''
      const lsId = typeof window !== 'undefined' ? (localStorage.getItem('line_user_id') || '') : ''
      const effectiveId = (queryId || lsId).trim()
      if (effectiveId) {
        setLineUserId(effectiveId)
        ApiService.setLineUserId(effectiveId)
        // 若從 URL 取得，順便存到 localStorage，方便後續使用
        if (queryId && typeof window !== 'undefined') {
          localStorage.setItem('line_user_id', effectiveId)
        }
        return
      }
    } catch (e) {
      console.warn('無法從 URL 或 localStorage 取得 line_user_id', e)
    }

    // 最後的保底：維持既有邏輯（可能為空字串）
    const id = ApiService.bootstrapLineUserId()
    if (id && id.trim()) {
      setLineUserId(id)
      ApiService.setLineUserId(id)
    }
  }, [isLineLoggedIn, lineUser])

  useEffect(() => {
    if (!lineUserId) return
    ;(async () => {
      const resp = await ApiService.getMySubscriptions()
      const items = (resp as any)?.data?.items || []
      const now = Date.now()
      const active = items.find((x: any) => x.status === 'active' && new Date(x.end_at).getTime() > now)
      const code = active?.plan?.code || ''
      setHasActivePro(Boolean(active && (code.startsWith('pro') || code.startsWith('school'))))
    })()
  }, [lineUserId])

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

  // 使用教師專用 hook 獲取課程和作業數據
  const {
    courses,
    assignments,
    loading,
    error,
    getCourseById,
    refetch
  } = useTeacherCourses(lineUserId)

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

      // 修正：如果沒有 schedule 資料，在 "all" 模式下仍然顯示
      const matchesDay = courseFilterDay === "all" ||
        (course.schedule && course.schedule.length > 0 && course.schedule.some(slot =>
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

  // 教師不使用手動新增，僅使用 Google Classroom 匯入
  const handleAddCourse = () => {
    // 此方法保留但不使用
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
          <>
            {!hasActivePro && (
              <div className="mb-4">
                <Card>
                  <div className="p-4 text-sm text-muted-foreground flex items-center justify-between">
                    <span>需要有效的 Pro 方案以啟用老師功能</span>
                    <Button size="sm" onClick={() => (window.location.href = '/pricing')}>前往升級</Button>
                  </div>
                </Card>
              </div>
            )}
            <TeacherDashboard
              courses={classroomCourses}
              assignments={assignments}
              onCourseClick={handleCourseClick}
              onAddCourse={handleAddCourse}
              onManageGroups={handleManageGroups}
              onRemindStudents={handleRemindStudents}
              user={user}
            />
          </>
        )
      case "courses":
        return (
          <div className="space-y-6 pb-24 pb-safe">
            {selectedCourseId ? (
              <>
                <div className="mb-6 flex items-center justify-center relative">
                  <button
                    onClick={() => setSelectedCourseId(null)}
                    aria-label="返回"
                    className="absolute left-0 p-2 hover:opacity-70 transition-opacity"
                  >
                    <ArrowLeftIcon className="w-5 h-5" />
                  </button>
                  <h1 className="text-lg font-semibold text-foreground">課程詳情</h1>
                </div>
                {selectedCourseId && (
                  <TeacherCourseDetail
                    courseId={selectedCourseId}
                    lineUserId={lineUserId}
                    showBackButton={false}
                    onDeleted={() => {
                      setSelectedCourseId(null)
                      refetch()
                    }}
                    onUpdated={() => refetch()}
                    onAssignmentClick={(assignmentId) => {
                      setSelectedAssignmentId(assignmentId)
                      handleTabChange("assignments")
                    }}
                  />
                )}
              </>
            ) : (
              <>
                {/* 標題 - 手機版 */}
                <div className="sm:hidden">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h1 className="text-2xl font-bold text-foreground">課程管理</h1>
                      <p className="text-muted-foreground">管理你的所有課程</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCourseView(courseView === "list" ? "calendar" : "list")}
                      className="text-xs"
                    >
                      {courseView === "list" ? (
                        <CalendarIcon className="w-3 h-3 mr-1" />
                      ) : (
                        <ListIcon className="w-3 h-3 mr-1" />
                      )}
                      <span>{courseView === "list" ? "月曆" : "列表"}</span>
                    </Button>
                  </div>
                  {/* 匯入按鈕 - 手機版獨立一行 */}
                  <div className="mb-4">
                    <ImportTeacherGoogleClassroomButton onImportComplete={() => {
                      console.log('========== 教師頁面：開始刷新課程列表 ==========')
                      console.log('當前課程數量:', courses.length)
                      refetch()
                      console.log('✅ refetch() 已呼叫')
                      console.log('================================================')
                    }} />
                  </div>
                </div>

                {/* 標題 - 電腦版 */}
                <div className="hidden sm:block mb-6 lg:mb-12 animate-slide-down">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 mobile-spacing">
                    <div className="min-w-0 flex-1">
                      <h1 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-foreground leading-tight">課程管理</h1>
                      <p className="text-sm sm:text-base lg:text-lg text-muted-foreground mt-2 lg:mt-3">管理你的所有課程</p>
                    </div>
                    <div className="flex-shrink-0">
                      <div className="flex flex-row gap-2">
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
                        {/* 教師專用 Classroom 匯入按鈕 */}
                        <ImportTeacherGoogleClassroomButton onImportComplete={() => {
                          console.log('========== 教師頁面：開始刷新課程列表 ==========')
                          console.log('當前課程數量:', courses.length)
                          refetch()
                          console.log('✅ refetch() 已呼叫')
                          console.log('================================================')
                        }} />
                      </div>
                    </div>
                  </div>
                </div>

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
                      {/* 教師專用 Classroom 匯入 */}
                      <div className="flex justify-center">
                        <ImportTeacherGoogleClassroomButton onImportComplete={() => {
                          console.log('========== 教師頁面：開始刷新課程列表 ==========')
                          console.log('當前課程數量:', courses.length)
                          refetch()
                          console.log('✅ refetch() 已呼叫')
                          console.log('================================================')
                        }} />
                      </div>
                    </Card>
                  )}

                </div>
              </>
            )}
          </div>
        )
      case "assignments":
        return (
          <div className="space-y-6 pb-24 pb-safe">
            {selectedAssignmentId ? (
              <>
                <div className="mb-6 flex items-center justify-center relative">
                  <button
                    onClick={() => setSelectedAssignmentId(null)}
                    aria-label="返回"
                    className="absolute left-0 p-2 hover:opacity-70 transition-opacity"
                  >
                    <ArrowLeftIcon className="w-5 h-5" />
                  </button>
                  <h1 className="text-lg font-semibold text-foreground">作業詳情</h1>
                </div>
                {(() => {
                  const assignment = assignments.find(a => a.id === selectedAssignmentId)
                  if (!assignment) {
                    return (
                      <Card className="p-6">
                        <p className="text-center text-muted-foreground">找不到作業資料</p>
                      </Card>
                    )
                  }
                  const course = getCourseById(assignment.courseId)
                  return (
                    <TeacherAssignmentDetail
                      assignment={assignment}
                      course={course}
                      onBack={() => setSelectedAssignmentId(null)}
                    />
                  )
                })()}
              </>
            ) : (
              <TeacherAssignmentManagement
                assignments={assignments}
                courses={courses}
                onAssignmentClick={(assignmentId) => setSelectedAssignmentId(assignmentId)}
              />
            )}
          </div>
        )
      
      case "profile":
        return <TeacherProfileContent user={user} onUserChange={setUser} lineUserId={lineUserId} />

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <TeacherSidebarNavigation activeTab={activeTab} onTabChange={handleTabChange} />
      <div className="lg:ml-[var(--sidebar-width)] transition-[margin] duration-300">
        <div className="mx-auto w-full px-3 sm:px-4 py-4 sm:py-6 pb-20 sm:pb-24 lg:px-6 xl:px-8 2xl:px-10 lg:py-10 lg:pb-10">
          {renderTabContent()}
        </div>
      </div>

      {/* 底部導航（行動版） */}
      <div className="lg:hidden">
        <TeacherBottomNavigation activeTab={activeTab} onTabChange={handleTabChange} />
      </div>
    </div>
  )
}
