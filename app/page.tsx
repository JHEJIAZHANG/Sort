"use client"

import { useState, useEffect, useMemo } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { BottomNavigation } from "@/components/bottom-navigation"
import { SidebarNavigation } from "@/components/sidebar-navigation"
import { PageHeader } from "@/components/page-header"
import { useLineAuth } from "@/hooks/use-line-auth"
import { useUserAuth } from "@/hooks/use-user-auth"
import { CourseForm } from "@/components/course-form"
import { CourseCard } from "@/components/course-card"
import { CourseDetail } from "@/components/course-detail"
import { CourseCalendar } from "@/components/course-calendar"
import { UnifiedCalendar } from "@/components/unified-calendar"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PlusIcon, CalendarIcon, ListIcon } from "@/components/icons"
import { useCourses } from "@/hooks/use-courses"
import { AssignmentForm } from "@/components/assignment-form"
import { AssignmentCard } from "@/components/assignment-card"
import { AssignmentFilters } from "@/components/assignment-filters"
import { AssignmentDetail } from "@/components/assignment-detail"
import { NoteForm } from "@/components/note-form"
import { NoteCard } from "@/components/note-card"
import { NoteFilters } from "@/components/note-filters"
import { NoteDetail } from "@/components/note-detail"
import { UpcomingSchedule } from "@/components/upcoming-schedule"
import { FloatingActionButton } from "@/components/floating-action-button"
import { ExamForm } from "@/components/exam-form"
import { ExamDetail } from "@/components/exam-detail"
import { ExamCard } from "@/components/exam-card"
import { ExamFilters } from "@/components/exam-filters"
import { ScrollSummary } from "@/components/scroll-summary"
import { TaskTypeToggle } from "@/components/task-type-toggle"
import { ProfileContent } from "@/components/profile-content"
import { CompactMonthlyCalendar } from "@/components/compact-monthly-calendar"
import { AddCourseDropdown } from "@/components/add-course-dropdown"
import { GoogleClassroomImport } from "@/components/google-classroom-import"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { getTaiwanTime, isTodayTaiwan, isExamEndedTaiwan, getDaysDifferenceTaiwan } from "@/lib/taiwan-time"
import type { Course } from "@/types/course"
import { CustomCategoryForm, type CustomCategoryItem } from "@/components/custom-category-form"
import { useCustomCategories } from "@/hooks/use-custom-categories"
import { useCustomTodos } from "@/hooks/use-custom-todos"
import { CustomCategoryCard } from "@/components/custom-category-card"
import { UnifiedTodoSection } from "@/components/unified-todo-section"
import { CustomCategoryFilters } from "@/components/custom-category-filters"
import { CustomCategoryDetail } from "@/components/custom-category-detail"
import { getNotificationSettings } from "@/components/profile-content"
import { GoogleClassroomSync } from "@/components/google-classroom-sync"
import { GoogleCalendarSync } from "@/components/google-calendar-sync"
import { ApiService } from "@/services/apiService"
import LiveDashboardStats, { DashboardStats } from "@/components/dashboard-stats"


export default function HomePage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  // 權限檢查 - 確保用戶已註冊
  const { isAuthenticated, needsRegistration, isLoading: authLoading } = useUserAuth()
  
  // 從 URL 參數獲取初始標籤頁，如果沒有則默認為 "home"
  const initialTab = searchParams.get('tab') || "home"
  const [activeTab, setActiveTab] = useState(initialTab)
  const [showCourseForm, setShowCourseForm] = useState(false)
  const [editingCourse, setEditingCourse] = useState<string | null>(null)
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null)
  const [showAssignmentForm, setShowAssignmentForm] = useState(false)
  const [editingAssignment, setEditingAssignment] = useState<string | null>(null)
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null)
  const [assignmentFilter, setAssignmentFilter] = useState("all")
  
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
      console.log('✅ 用戶已認證，允許訪問應用首頁')
    }
  }, [authLoading, needsRegistration, isAuthenticated, router])

  // 使用 LINE 認證獲取真實的 user ID
  const { user: lineUser, isLoggedIn: isLineLoggedIn, isLoading: lineLoading } = useLineAuth()
  const [lineUserId, setLineUserId] = useState<string>("")
  
  useEffect(() => {
    if (isLineLoggedIn && lineUser?.userId) {
      // 使用真實的 LINE user ID
      setLineUserId(lineUser.userId)
      ApiService.setLineUserId(lineUser.userId)
    } else {
      // 未登入時維持空的 LINE 使用者識別
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
          // 保持預設的訪客資料
        }
      }
      fetchUserProfile()
    }
  }, [lineUserId])

  // 監聽 URL 參數變化
  useEffect(() => {
    const tabParam = searchParams.get('tab')
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam)
    }
  }, [searchParams, activeTab])

  // 更新 URL 參數的函數
  const updateTabInUrl = (tab: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (tab === "home") {
      params.delete('tab') // 首頁不需要參數
    } else {
      params.set('tab', tab)
    }
    const newUrl = params.toString() ? `?${params.toString()}` : '/'
    router.replace(newUrl, { scroll: false })
  }

  // 標籤頁切換函數
  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    updateTabInUrl(tab)
  }

  const [showNoteForm, setShowNoteForm] = useState(false)
  const [editingNote, setEditingNote] = useState<string | null>(null)
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null)
  const [noteFilter, setNoteFilter] = useState("all")
  const [noteSortBy, setNoteSortBy] = useState("updatedAt")
  const [noteSearchQuery, setNoteSearchQuery] = useState("")
  const [showExamForm, setShowExamForm] = useState(false)
  const [editingExam, setEditingExam] = useState<string | null>(null)
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null)
  const [examFilter, setExamFilter] = useState("all")
  const [courseView, setCourseView] = useState<"list" | "calendar">("list")
  const [taskType, setTaskType] = useState<string>("assignment") // Changed to string to support custom categories
  const [selectedDate, setSelectedDate] = useState(getTaiwanTime())
  const [showGoogleClassroomImport, setShowGoogleClassroomImport] = useState(false)
  // 自訂分類：改用後端 hook
  const { categories: customCategoriesApi, addCategory, updateCategory, deleteCategory, refetch: refetchCategories } = useCustomCategories(lineUserId)
  // 自訂待辦：改為使用後端 hook
  const { items: customCategoryItemsApi, addItem: addCustomTodoApi, updateItem: updateCustomTodoApi, deleteItem: deleteCustomTodoApi, isLoading: customTodosLoading, error: customTodosError, refetch: refetchCustomTodos } = useCustomTodos(lineUserId)
  const [customCategoryItems, setCustomCategoryItems] = useState<CustomCategoryItem[]>([])  // 由 API 同步填入
  const [showCustomCategoryForm, setShowCustomCategoryForm] = useState(false)
  const [editingCustomCategory, setEditingCustomCategory] = useState<string | null>(null)
  const [selectedCustomCategoryId, setSelectedCustomCategoryId] = useState<string | null>(null)
  const [customCategoryFilter, setCustomCategoryFilter] = useState("all") // Added custom category filter state
  const [notificationSettings, setNotificationSettings] = useState(() => getNotificationSettings())



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

  // 暫時使用固定的 lineUserId，實際應用中需要從 LINE 認證獲取
  // const lineUserId = "test_user_123" // 已在上方定義

  const {
    courses,
    assignments,
    notes,
    exams,
    loading,
    error,
    addCourse,
    updateCourse,
    getCourseById,
    getAssignmentsByCourse,
    getNotesByCourse,
    getExamsByCourse,
    addAssignment,
    updateAssignment,
    deleteAssignment,
    getAssignmentById,
    addNote,
    updateNote,
    deleteNote,
    addExam,
    updateExam,
    deleteExam,
    getExamById,
    deleteCourse,
    refetch
  } = useCourses(lineUserId)

  const getNoteById = (id: string) => {
    return notes.find((note) => note.id === id)
  }

  // 監聽課程更新事件（來自 OCR 創建課程）
  useEffect(() => {
    const handleCoursesUpdated = () => {
      // 刷新課程數據
      refetch()
    }

    window.addEventListener('coursesUpdated', handleCoursesUpdated)
    
    return () => {
      window.removeEventListener('coursesUpdated', handleCoursesUpdated)
    }
  }, [refetch])

  const addCustomCategoryItem = (itemData: Omit<CustomCategoryItem, "id" | "createdAt" | "updatedAt">) => {
    ;(async () => {
      try {
        // 將分類名稱轉為後端所需的分類 UUID
        const cat = customCategoriesApi.find((c) => c.name === itemData.category)
        await addCustomTodoApi({
          category: cat ? cat.id : null,
          course: itemData.courseId || null,
          title: itemData.title,
          description: itemData.description || "",
          dueDate: itemData.dueDate,
          status: itemData.status,
        })
        await refetchCustomTodos()
      } catch (e) {
        console.error('自訂待辦建立失敗', e)
      }
    })()
  }

  const updateCustomCategoryItem = (id: string, updates: Partial<CustomCategoryItem>) => {
    ;(async () => {
      try {
        const payload: any = {}
        if (updates.title !== undefined) payload.title = updates.title
        if (updates.description !== undefined) payload.description = updates.description
        if (updates.dueDate !== undefined) payload.due_date = (updates.dueDate as Date).toISOString()
        if (updates.status !== undefined) payload.status = updates.status
        if (updates.category !== undefined) {
          const cat = customCategoriesApi.find((c) => c.name === updates.category)
          payload.category = cat ? cat.id : null
        }
        if ((updates as any).courseId !== undefined) payload.course = (updates as any).courseId
        await updateCustomTodoApi(id, payload)
        await refetchCustomTodos()
      } catch (e) {
        console.error('自訂待辦更新失敗', e)
      }
    })()
  }

  const deleteCustomCategoryItem = (id: string) => {
    ;(async () => {
      try {
        await deleteCustomTodoApi(id)
        await refetchCustomTodos()
      } catch (e) {
        console.error('自訂待辦刪除失敗', e)
      }
    })()
  }

  // 以 hook 的資料為主
  useEffect(() => {
    const mapped = customCategoryItemsApi.map((i) => {
      const catName = customCategoriesApi.find((c) => c.id === (i as any).category)?.name || ""
      return {
        id: i.id,
        category: catName,
        courseId: (i as any).course || "",
        title: i.title,
        description: i.description,
        dueDate: i.dueDate,
        status: i.status,
        createdAt: i.createdAt,
        updatedAt: i.updatedAt,
      } as CustomCategoryItem
    })
    setCustomCategoryItems(mapped)
  }, [customCategoryItemsApi, customCategoriesApi])

  const getCustomCategoryItemById = (id: string) => {
    return customCategoryItems.find((item) => item.id === id)
  }

  const handleDeleteCategory = async (categoryName: string) => {
    if (!categoryName) return
    const cat = customCategoriesApi.find((c) => c.name === categoryName)
    if (!cat) return
    if (!confirm(`確定要刪除「${categoryName}」分類嗎？這將會刪除該分類下的所有待辦事項。`)) return
    await deleteCategory(cat.id)
    setCustomCategoryItems((prev) => prev.filter((item) => item.category !== categoryName))
    if (taskType === categoryName) setTaskType("assignment")
  }



  const renderContent = () => {
    if (showExamForm) {
      return (
        <div>
          <PageHeader title={editingExam ? "編輯考試" : "新增考試"} />
          <ExamForm
            courses={courses}
            initialData={editingExam ? getExamById(editingExam) : undefined}
            onSubmit={(examData) => {
              if (editingExam) {
                updateExam(editingExam, examData)
              } else {
                addExam(examData)
              }
              setShowExamForm(false)
              setEditingExam(null)
            }}
            onCancel={() => {
              setShowExamForm(false)
              setEditingExam(null)
            }}
          />
        </div>
      )
    }

    if (activeTab === "assignments") {
      return (
        <div className="space-y-6">
          <GoogleClassroomSync
            onSync={() => {
              // Refresh assignments after sync
              console.log("[v0] Google Classroom sync completed")
            }}
          />
          <GoogleCalendarSync
            onSync={() => {
              // Refresh calendar events after sync
              console.log("[v0] Google Calendar sync completed")
            }}
          />
        </div>
      )
    }

    if (activeTab === "courses") {
      if (showCourseForm) {
        return (
          <div>
            <PageHeader title={editingCourse ? "編輯課程" : "新增課程"} />
            <CourseForm
              initialCourse={editingCourse ? getCourseById(editingCourse) : undefined}
              existingCourses={courses}
              onSubmit={async (courseData) => {
                try {
                  if (editingCourse) {
                    await updateCourse(editingCourse, courseData)
                  } else {
                    await addCourse(courseData)
                  }
                  setShowCourseForm(false)
                  setEditingCourse(null)
                } catch (error) {
                  console.error('課程操作失敗:', error)
                  // 可以在這裡顯示錯誤訊息給用戶
                }
              }}
              onBulkImport={async () => {
                // OCR 批量導入完成後，關閉表單並刷新課程列表
                setShowCourseForm(false)
                setEditingCourse(null)
                // 刷新課程數據
                await refetch()
              }}
              onCancel={() => {
                setShowCourseForm(false)
                setEditingCourse(null)
              }}
            />
          </div>
        )
      }

      return <CoursesContent />
    }

    if (activeTab === "tasks") {
      if (selectedAssignmentId) {
        const assignment = getAssignmentById(selectedAssignmentId)
        if (assignment) {
          return (
            <AssignmentDetail
              assignment={assignment}
              course={getCourseById(assignment.courseId)}
              onBack={() => setSelectedAssignmentId(null)}
              onEdit={() => {
                setEditingAssignment(assignment.id)
                setSelectedAssignmentId(null)
                setShowAssignmentForm(true)
              }}
              onDelete={() => {
                if (confirm("確定要刪除這個作業嗎？")) {
                  deleteAssignment(assignment.id)
                  setSelectedAssignmentId(null)
                }
              }}
              onStatusChange={(status) => {
                updateAssignment(selectedAssignmentId, { status })
              }}
            />
          )
        }
      }

      if (selectedExamId) {
        const exam = getExamById(selectedExamId)
        if (exam) {
          return (
            <ExamDetail
              exam={exam}
              course={getCourseById(exam.courseId)}
              onBack={() => setSelectedExamId(null)}
              onEdit={() => {
                setEditingExam(exam.id)
                setSelectedExamId(null)
                setShowExamForm(true)
              }}
              onDelete={() => {
                if (confirm("確定要刪除這個考試嗎？")) {
                  deleteExam(exam.id)
                  setSelectedExamId(null)
                }
              }}
              onStatusChange={(status) => updateExam(exam.id, { status })}
            />
          )
        }
      }

      if (selectedCustomCategoryId) {
        const item = getCustomCategoryItemById(selectedCustomCategoryId)
        if (item) {
          return (
            <CustomCategoryDetail
              item={item}
              course={getCourseById(item.courseId) || undefined}
              onBack={() => setSelectedCustomCategoryId(null)}
              onEdit={() => {
                setEditingCustomCategory(item.id)
                setSelectedCustomCategoryId(null)
                setShowCustomCategoryForm(true)
              }}
              onDelete={() => {
                if (confirm(`確定要刪除這個${taskType}嗎？`)) {
                  deleteCustomCategoryItem(item.id)
                  setSelectedCustomCategoryId(null)
                }
              }}
              onStatusChange={(id, status) => updateCustomCategoryItem(id, { status })}
            />
          )
        }
      }

      if (showAssignmentForm) {
        return (
          <div>
            <PageHeader title={editingAssignment ? "編輯作業" : "新增作業"} />
            <AssignmentForm
              courses={courses}
              initialData={editingAssignment ? getAssignmentById(editingAssignment) : undefined}
              onSubmit={(assignmentData) => {
                if (editingAssignment) {
                  updateAssignment(editingAssignment, assignmentData)
                } else {
                  addAssignment(assignmentData)
                }
                setShowAssignmentForm(false)
                setEditingAssignment(null)
              }}
              onCancel={() => {
                setShowAssignmentForm(false)
                setEditingAssignment(null)
              }}
            />
          </div>
        )
      }

      if (showExamForm) {
        return (
          <div>
            <PageHeader title={editingExam ? "編輯考試" : "新增考試"} />
            <ExamForm
              courses={courses}
              initialData={editingExam ? getExamById(editingExam) : undefined}
              onSubmit={(examData) => {
                if (editingExam) {
                  updateExam(editingExam, examData)
                } else {
                  addExam(examData)
                }
                setShowExamForm(false)
                setEditingExam(null)
              }}
              onCancel={() => {
                setShowExamForm(false)
                setEditingExam(null)
              }}
            />
          </div>
        )
      }

      if (showCustomCategoryForm) {
        return (
          <div>
            <PageHeader title={editingCustomCategory ? `編輯${taskType}` : `新增${taskType}`} />
            <CustomCategoryForm
              courses={courses}
              category={taskType}
              initialData={editingCustomCategory ? getCustomCategoryItemById(editingCustomCategory) : undefined}
              onSubmit={(itemData) => {
                if (editingCustomCategory) {
                  updateCustomCategoryItem(editingCustomCategory, itemData)
                } else {
                  addCustomCategoryItem(itemData)
                }
                setShowCustomCategoryForm(false)
                setEditingCustomCategory(null)
              }}
              onCancel={() => {
                setShowCustomCategoryForm(false)
                setEditingCustomCategory(null)
              }}
            />
          </div>
        )
      }

      return <TasksContent />
    }

    if (activeTab === "notes") {
      if (selectedNoteId) {
        const note = getNoteById(selectedNoteId)
        if (note) {
          return (
            <NoteDetail
              note={note}
              course={getCourseById(note.courseId)}
              onBack={() => setSelectedNoteId(null)}
              onEdit={() => {
                setEditingNote(note.id)
                setSelectedNoteId(null)
                setShowNoteForm(true)
              }}
              onDelete={() => {
                if (confirm("確定要刪除這個筆記嗎？")) {
                  deleteNote(note.id)
                  setSelectedNoteId(null)
                }
              }}
            />
          )
        }
      }

      if (showNoteForm) {
        return (
          <div>
            <PageHeader title={editingNote ? "編輯筆記" : "新增筆記"} />
            <NoteForm
              courses={courses}
              initialData={editingNote ? getNoteById(editingNote) : undefined}
              onSubmit={(noteData) => {
                if (editingNote) {
                  updateNote(editingNote, noteData)
                } else {
                  addNote(noteData)
                }
                setShowNoteForm(false)
                setEditingNote(null)
              }}
              onCancel={() => {
                setShowNoteForm(false)
                setEditingNote(null)
              }}
            />
          </div>
        )
      }

      return <NotesContent />
    }

    if (activeTab === "profile") {
      return <ProfileContent user={user} onUserChange={setUser} />
    }

    switch (activeTab) {
      case "home":
        return <HomeContent />
      default:
        return <HomeContent />
    }
  }

  function HomeContent() {
    const taiwanNow = getTaiwanTime()
    // 將 JavaScript 的 getDay() 結果轉換為後端格式
    // JavaScript Date: 0=週日, 1=週一, 2=週二, 3=週三, 4=週四, 5=週五, 6=週六
    // 我們的系統: 0=週一, 1=週二, 2=週三, 3=週四, 4=週五, 5=週六, 6=週日
    const selectedDay = selectedDate.getDay() === 0 ? 6 : selectedDate.getDay() - 1
    const isViewingToday = isTodayTaiwan(selectedDate)

    const dateCourses = courses.filter((course) => course.schedule.some((slot) => slot.dayOfWeek === selectedDay))

    return (
      <>
        <div className="space-y-6 lg:grid lg:grid-cols-5 lg:gap-4 xl:gap-6 lg:space-y-0 mb-6 max-w-full overflow-hidden">
          {/* Mobile: Date (ScrollSummary) - First on mobile */}
          <div className="lg:col-span-2 lg:space-y-6">
            {/* Header live indicator */}
            <div className="flex items-center justify-between">
              <LiveDashboardStats />
            </div>
            {/* 摘要 */}
            <ScrollSummary
              courses={courses}
              assignments={assignments}
              exams={exams}
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
              user={user}
            />

            {/* Mobile: Recent Courses - Second on mobile, Desktop: stays in left column */}
            <div className="lg:block">
              <UpcomingSchedule courses={courses} selectedDate={selectedDate} />
            </div>

            {/* Mobile: Todo Items - Third on mobile, Desktop: stays in left column */}
            <div className="lg:block">
              <UnifiedTodoSection
                assignments={assignments}
                exams={exams}
                customCategoryItems={customCategoryItems}
                courses={courses}
                selectedDate={selectedDate}
                notificationSettings={{
                  assignmentReminderTiming: notificationSettings.assignmentReminderTiming,
                }}
                onViewItem={(id, type) => {
                  if (type === "assignment") {
                    setSelectedAssignmentId(id)
                    setTaskType("assignment")
                  } else if (type === "exam") {
                    setSelectedExamId(id)
                    setTaskType("exam")
                  } else if (type === "custom") {
                    const item = getCustomCategoryItemById(id)
                    if (item) {
                      setSelectedCustomCategoryId(id)
                      setTaskType(item.category)
                    }
                  }
                  handleTabChange("tasks")
                }}
                onViewAllTodos={() => {
                  handleTabChange("tasks")
                }}
                onAssignmentStatusChange={(id, status) => { void updateAssignment(id, { status }) }}
                onExamStatusChange={(id, status) => { void updateExam(id, { status }) }}
                onCustomTodoStatusChange={(id, status) => { updateCustomCategoryItem(id, { status }) }}
              />
            </div>
          </div>

          {/* Mobile: Calendar - Fourth on mobile, Desktop: right column */}
          <div className="lg:col-span-3 w-full max-w-full">
            <div className="w-full max-w-md mx-auto lg:max-w-full">
              <CompactMonthlyCalendar 
                    selectedDate={selectedDate} 
                    onDateSelect={setSelectedDate}
                    assignments={assignments}
                    exams={exams}
                  />
            </div>
          </div>
        </div>
      </>
    )
  }

  function CoursesContent() {
    return (
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
              <AddCourseDropdown
                onManualAdd={() => setShowCourseForm(true)}
                onGoogleClassroomImport={() => setShowGoogleClassroomImport(true)}
              />
            </>
          }
        />

        {courses.length > 0 ? (
          courseView === "list" ? (
            <div className="space-y-2 sm:space-y-3">
              {courses.map((course) => (
                <CourseCard key={course.id} course={course} onClick={() => setSelectedCourseId(course.id)} />
              ))}
            </div>
          ) : (
            <UnifiedCalendar 
              courses={courses} 
              onCourseClick={(courseId) => setSelectedCourseId(courseId)}
              onEventClick={(event) => {
                console.log('Calendar event clicked:', event)
                // 可以在這裡添加事件詳情顯示邏輯
              }}
            />
          )
        ) : (
          <Card className="p-4 sm:p-8 text-center">
            <p className="text-muted-foreground mb-4 text-sm sm:text-base">還沒有任何課程</p>
            <AddCourseDropdown
              onManualAdd={() => setShowCourseForm(true)}
              onGoogleClassroomImport={() => setShowGoogleClassroomImport(true)}
            />
          </Card>
        )}

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
              <CourseDetail 
                courseId={selectedCourseId} 
                lineUserId={lineUserId} 
                showBackButton={false}
                onOpenAssignment={(id) => {
                  handleTabChange("tasks")
                  setSelectedAssignmentId(id)
                }}
                onOpenExam={(id) => {
                  handleTabChange("tasks")
                  setSelectedExamId(id)
                }}
                onOpenNote={(id) => {
                  handleTabChange("notes")
                  setSelectedNoteId(id)
                }}
                onOpenCustomTodo={(id) => {
                  const item = getCustomCategoryItemById(id)
                  if (item) setTaskType(item.category)
                  setSelectedCustomCategoryId(id)
                  handleTabChange("tasks")
                }}
                onDeleted={() => {
                  setSelectedCourseId(null)
                  // 刪除後同步父層資料，避免需要手動刷新
                  refetch()
                }}
                onUpdated={() => {
                  // 更新後刷新課程列表
                  refetch()
                }}
              />
            )}
          </DialogContent>
        </Dialog>
      </>
    )
  }

  function TasksContent() {
    const handleAddCategory = async (name: string, icon: string) => {
      if (!customCategoriesApi.some((cat) => cat.name === name)) {
        // Add category using API
        await addCategory({ name, icon, color: "#3b82f6" })
        await refetchCategories()
        setTaskType(name)
      }
    }

    const handleEditCategory = async (oldName: string, newName: string, newIcon: string) => {
      // Find the category to update
      const categoryToUpdate = customCategoriesApi.find((cat) => cat.name === oldName)
      if (!categoryToUpdate) return

      // Update category using API
      await updateCategory(categoryToUpdate.id, { name: newName, icon: newIcon })
      await refetchCategories()

      // Update all items in this category to use new name and icon
      setCustomCategoryItems((prev) =>
        prev.map((item) =>
          item.category === oldName ? { ...item, category: newName, icon: newIcon, updatedAt: new Date() } : item,
        ),
      )

      // Update current task type if it was the edited category
      if (taskType === oldName) {
        setTaskType(newName)
      }
    }

    const pendingAssignmentCount = assignments.filter((a) => a.status !== "completed").length
    const pendingExamCount = exams.filter((e) => e.status !== "completed").length

    const customCategoryData = customCategoriesApi.map((cat) => {
      const categoryItems = customCategoryItems.filter(
        (item) => item.category === cat.name && item.status !== "completed",
      )
      return {
        name: cat.name,
        icon: cat.icon,
        count: categoryItems.length,
      }
    })

    return (
      <>
        <PageHeader
          title="待辦事項"
          subtitle="追蹤你的作業與考試"
          action={
            <Button
              size="sm"
              onClick={() => {
                if (taskType === "assignment") {
                  setShowAssignmentForm(true)
                } else if (taskType === "exam") {
                  setShowExamForm(true)
                } else {
                  setShowCustomCategoryForm(true)
                }
              }}
            >
              <PlusIcon className="w-4 h-4 mr-1" />
              新增
            </Button>
          }
        />

        <TaskTypeToggle
          taskType={taskType}
          setTaskType={setTaskType}
          pendingAssignmentCount={pendingAssignmentCount}
          pendingExamCount={pendingExamCount}
          customCategoryData={customCategoryData}
          onAddCategory={async (name, icon) => {
            await addCategory({ name, icon, color: "#3b82f6" })
            await refetchCategories()
            // 新增完成後，立即切換至該分類，避免後續新增待辦仍落在舊分類
            setTaskType(name)
          }}
          onEditCategory={async (oldName, newName, newIcon) => {
            const cat = customCategoriesApi.find((c) => c.name === oldName)
            if (cat) await updateCategory(cat.id, { name: newName, icon: newIcon })
          }}
          onDeleteCategory={handleDeleteCategory}
        />

        {taskType === "assignment" ? (
          <AssignmentsContent />
        ) : taskType === "exam" ? (
          <ExamsContent />
        ) : (
          <CustomCategoryContent />
        )}
      </>
    )
  }

  function CustomCategoryContent() {
    const filteredCustomCategoryItems = customCategoryItems.filter((item) => {
      // 僅顯示目前選取的自訂分類
      if (item.category !== taskType) return false
      const today = new Date()
      const daysUntilDue = getDaysDifferenceTaiwan(today, item.dueDate)
      const isOverdue = item.status === "overdue" || (item.status === "pending" && daysUntilDue < 0)

      // Update overdue status if needed
      if (item.status === "pending" && daysUntilDue < 0) {
        updateCustomCategoryItem(item.id, { status: "overdue" })
      }

      switch (customCategoryFilter) {
        case "pending":
          return item.status === "pending" && !isOverdue
        case "completed":
          return item.status === "completed"
        case "overdue":
          return item.status === "overdue" || isOverdue
        default:
          return true
      }
    })

    const sortedCustomCategoryItems = filteredCustomCategoryItems.sort((a, b) => {
      if (a.status === "overdue" && b.status !== "overdue") return -1
      if (b.status === "overdue" && a.status !== "overdue") return 1
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    })

    const counts = {
      all: customCategoryItems.length,
      pending: customCategoryItems.filter((item) => {
        const today = new Date()
        const daysUntilDue = getDaysDifferenceTaiwan(today, item.dueDate)
        return item.status === "pending" && daysUntilDue >= 0
      }).length,
      completed: customCategoryItems.filter((item) => item.status === "completed").length,
      overdue: customCategoryItems.filter((item) => {
        const today = new Date()
        const daysUntilDue = getDaysDifferenceTaiwan(today, item.dueDate)
        return item.status === "overdue" || (item.status === "pending" && daysUntilDue < 0)
      }).length,
    }

    return (
      <>
        <CustomCategoryFilters
          activeFilter={customCategoryFilter}
          onFilterChange={setCustomCategoryFilter}
          counts={counts}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {sortedCustomCategoryItems.map((item) => (
            <CustomCategoryCard
              key={item.id}
              item={item}
              course={getCourseById(item.courseId)}
              onStatusChange={(id, status) => updateCustomCategoryItem(id, { status })}
              onViewDetail={() => setSelectedCustomCategoryId(item.id)}
              onEdit={() => {
                setEditingCustomCategory(item.id)
                setShowCustomCategoryForm(true)
              }}
              onDelete={() => deleteCustomCategoryItem(item.id)}
            />
          ))}
        </div>
        {sortedCustomCategoryItems.length === 0 && (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground mb-4">
              {customCategoryFilter === "all"
                ? `還沒有任何${taskType}`
                : customCategoryFilter === "pending"
                  ? `沒有進行中的${taskType}`
                  : customCategoryFilter === "completed"
                    ? `沒有已完成的${taskType}`
                    : `沒有已逾期的${taskType}`}
            </p>
            {customCategoryFilter === "all" && (
              <Button onClick={() => setShowCustomCategoryForm(true)}>新增第一個{taskType}</Button>
            )}
          </Card>
        )}
      </>
    )
  }

  function AssignmentsContent() {
    const [, forceUpdate] = useState({})

    useEffect(() => {
      const interval = setInterval(() => {
        forceUpdate({})
      }, 10000) // Check every 10 seconds for immediate overdue detection

      return () => clearInterval(interval)
    }, [])

    useEffect(() => {
      const checkAssignmentStatus = () => {
        const taiwanNow = getTaiwanTime()

        assignments.forEach((assignment) => {
          const isOverdue = taiwanNow.getTime() > assignment.dueDate.getTime()

          console.log(
            "[v0] Assignment:",
            assignment.title,
            "Due:",
            assignment.dueDate,
            "Now:",
            taiwanNow,
            "IsOverdue:",
            isOverdue,
            "Status:",
            assignment.status,
          )

          if (assignment.status === "pending" && isOverdue) {
            updateAssignment(assignment.id, { status: "overdue" })
          } else if (assignment.status === "overdue" && !isOverdue) {
            // If assignment was overdue but due date was changed to future, make it pending again
            updateAssignment(assignment.id, { status: "pending" })
          }
        })
      }

      checkAssignmentStatus()
    }, [assignments, updateAssignment])

    const filteredAssignments = assignments.filter((assignment) => {
      switch (assignmentFilter) {
        case "pending":
          return assignment.status === "pending"
        case "completed":
          return assignment.status === "completed"
        case "overdue":
          return assignment.status === "overdue"
        default:
          return true
      }
    })

    const sortedAssignments = filteredAssignments.sort((a, b) => {
      if (a.status === "overdue" && b.status !== "overdue") return -1
      if (b.status === "overdue" && a.status !== "overdue") return 1
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    })

    const counts = {
      all: assignments.length,
      pending: assignments.filter((a) => a.status === "pending").length,
      completed: assignments.filter((a) => a.status === "completed").length,
      overdue: assignments.filter((a) => a.status === "overdue").length,
    }

    return (
      <>
        <AssignmentFilters activeFilter={assignmentFilter} onFilterChange={setAssignmentFilter} counts={counts} />

        {sortedAssignments.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {sortedAssignments.map((assignment) => (
              <AssignmentCard
                key={assignment.id}
                assignment={assignment}
                course={getCourseById(assignment.courseId)}
                onStatusChange={(id, status) => updateAssignment(id, { status })}
                onViewDetail={() => setSelectedAssignmentId(assignment.id)}
                onEdit={() => {
                  setEditingAssignment(assignment.id)
                  setSelectedAssignmentId(null)
                  setShowAssignmentForm(true)
                }}
                onDelete={() => {
                  if (confirm("確定要刪除這個作業嗎？")) {
                    deleteAssignment(assignment.id)
                  }
                }}
              />
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center">
            <p className="text-sm text-muted-foreground mb-2">
              {assignmentFilter === "all"
                ? "還沒有任何作業"
                : `沒有${assignmentFilter === "pending" ? "進行中" : assignmentFilter === "completed" ? "已完成" : "已逾期"}的作業`}
            </p>
            {assignmentFilter === "all" && (
              <Button onClick={() => setShowAssignmentForm(true)}>
                <PlusIcon className="w-4 h-4 mr-2" />
                新增第一個作業
              </Button>
            )}
          </Card>
        )}
      </>
    )
  }

  function NotesContent() {
    const filteredNotes = notes.filter((note) => {
      const matchesFilter = noteFilter === "all" || note.courseId === noteFilter
      const matchesSearch =
        noteSearchQuery === "" ||
        note.title.toLowerCase().includes(noteSearchQuery.toLowerCase()) ||
        note.content.toLowerCase().includes(noteSearchQuery.toLowerCase())

      return matchesFilter && matchesSearch
    })

    const sortedNotes = filteredNotes.sort((a, b) => {
      switch (noteSortBy) {
        case "title":
          return a.title.localeCompare(b.title, "zh-TW")
        case "createdAt":
          return b.createdAt.getTime() - a.createdAt.getTime()
        case "updatedAt":
        default:
          return b.updatedAt.getTime() - a.updatedAt.getTime()
      }
    })

    const counts = {
      all: notes.length,
      ...courses.reduce(
        (acc, course) => {
          acc[course.id] = notes.filter((note) => note.courseId === course.id).length
          return acc
        },
        {} as Record<string, number>,
      ),
    }

    return (
      <>
        <PageHeader
          title="筆記管理"
          subtitle="記錄你的學習筆記"
          action={
            <Button size="sm" onClick={() => setShowNoteForm(true)}>
              <PlusIcon className="w-4 h-4 mr-1" />
              新增
            </Button>
          }
        />

        {courses.length > 0 && (
          <NoteFilters
            courses={courses}
            activeFilter={noteFilter}
            onFilterChange={setNoteFilter}
            counts={counts}
            sortBy={noteSortBy}
            onSortChange={setNoteSortBy}
            searchQuery={noteSearchQuery}
            onSearchChange={setNoteSearchQuery}
          />
        )}

        {sortedNotes.length > 0 ? (
          <div className="space-y-4">
            {sortedNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                course={getCourseById(note.courseId)}
                onClick={() => setSelectedNoteId(note.id)}
                onEdit={() => {
                  setEditingNote(note.id)
                  setSelectedNoteId(null)
                  setShowNoteForm(true)
                }}
                onDelete={() => {
                  if (confirm("確定要刪除這個筆記嗎？")) {
                    deleteNote(note.id)
                  }
                }}
              />
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center">
            <p className="text-sm text-muted-foreground mb-2">還沒有任何筆記</p>
            <Button onClick={() => setShowNoteForm(true)}>新增第一個筆記</Button>
          </Card>
        )}
      </>
    )
  }

  function ExamsContent() {
    const [, forceUpdate] = useState({})

    useEffect(() => {
      const interval = setInterval(() => {
        forceUpdate({})
      }, 10000) // Check every 10 seconds instead of 60 seconds

      return () => clearInterval(interval)
    }, [])

    useEffect(() => {
      const checkExamStatus = () => {
        exams.forEach((exam) => {
          const isEnded = isExamEndedTaiwan(exam.examDate, exam.duration)
          console.log(
            "[v0] Exam:",
            exam.title,
            "Date:",
            exam.examDate,
            "Duration:",
            exam.duration,
            "IsEnded:",
            isEnded,
            "Status:",
            exam.status,
          )

          if (exam.status === "pending" && isEnded) {
            updateExam(exam.id, { status: "overdue" })
          } else if (exam.status === "overdue" && !isEnded) {
            // If exam was overdue but date was changed to future, make it pending again
            updateExam(exam.id, { status: "pending" })
          }
        })
      }

      checkExamStatus()
    }, [exams, updateExam])

    const now = new Date()
    const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    const filteredExams = exams.filter((exam) => {
      const examDate = new Date(exam.examDate)

      switch (examFilter) {
        case "upcoming":
          return (
            examDate >= now && examDate <= oneWeekFromNow && exam.status !== "completed" && exam.status !== "overdue"
          )
        case "scheduled":
          return examDate > oneWeekFromNow && exam.status !== "completed" && exam.status !== "overdue"
        case "completed":
          return exam.status === "completed"
        case "overdue":
          return exam.status === "overdue"
        default:
          return true
      }
    })

    const sortedExams = filteredExams.sort((a, b) => {
      if (a.status === "overdue" && b.status !== "overdue") return -1
      if (b.status === "overdue" && a.status !== "overdue") return 1
      return new Date(a.examDate).getTime() - new Date(b.examDate).getTime()
    })

    const counts = {
      all: exams.length,
      upcoming: exams.filter((e) => {
        const examDate = new Date(e.examDate)
        return examDate >= now && examDate <= oneWeekFromNow && e.status !== "completed" && e.status !== "overdue"
      }).length,
      scheduled: exams.filter((e) => {
        const examDate = new Date(e.examDate)
        return examDate > oneWeekFromNow && e.status !== "completed" && e.status !== "overdue"
      }).length,
      completed: exams.filter((e) => e.status === "completed").length,
      overdue: exams.filter((e) => e.status === "overdue").length,
    }

    return (
      <>
        <ExamFilters activeFilter={examFilter} onFilterChange={setExamFilter} counts={counts} />

        {sortedExams.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {sortedExams.map((exam) => (
              <ExamCard
                key={exam.id}
                exam={exam}
                course={getCourseById(exam.courseId)}
                onViewDetail={() => setSelectedExamId(exam.id)}
                onEdit={() => {
                  setEditingExam(exam.id)
                  setSelectedExamId(null)
                  setShowExamForm(true)
                }}
                onDelete={() => {
                  if (confirm("確定要刪除這個考試嗎？")) {
                    deleteExam(exam.id)
                  }
                }}
                onStatusChange={(id, status) => updateExam(id, { status })}
              />
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground mb-4">
              {examFilter === "all"
                ? "還沒有任何考試"
                : examFilter === "upcoming"
                  ? "沒有即將來臨的考試"
                  : examFilter === "scheduled"
                    ? "沒有已排程的考試"
                    : examFilter === "completed"
                      ? "沒有已結束的考試"
                      : "沒有已逾期的考試"}
            </p>
            {examFilter === "all" && (
              <Button onClick={() => setShowExamForm(true)}>
                <PlusIcon className="w-4 h-4 mr-2" />
                新增第一個考試
              </Button>
            )}
          </Card>
        )}
      </>
    )
  }

  const handleBulkImport = async (course: Omit<Course, "id" | "createdAt">) => {
    try {
      await addCourse(course)
    } catch (error) {
      console.error('匯入課程失敗:', error)
    }
  }

  useEffect(() => {
    const handleSettingsChange = (event: CustomEvent) => {
      setNotificationSettings(event.detail)
    }

    window.addEventListener("notificationSettingsChanged", handleSettingsChange as EventListener)

    return () => {
      window.removeEventListener("notificationSettingsChanged", handleSettingsChange as EventListener)
    }
  }, [])

  // 載入狀態顯示
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
          <h2 className="text-2xl font-bold mt-4">載入中...</h2>
          <p className="text-gray-600">正在載入您的資料...</p>
        </div>
      </div>
    )
  }

  // 錯誤狀態顯示
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">載入失敗</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => refetch()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            重新載入
          </button>
        </div>
      </div>
    )
  }

  // 權限檢查載入狀態
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600">正在驗證用戶權限...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <SidebarNavigation activeTab={activeTab} onTabChange={handleTabChange} />
      <div className="lg:ml-[var(--sidebar-width)] transition-[margin] duration-300">
        <div className="mx-auto w-full px-3 sm:px-4 py-4 sm:py-6 pb-20 sm:pb-24 lg:px-6 xl:px-8 2xl:px-10 lg:py-10 lg:pb-10">{renderContent()}</div>
      </div>

      <div className="lg:hidden">
        <BottomNavigation
          activeTab={activeTab}
          onTabChange={(tab) => {
            handleTabChange(tab)
            if (tab === "home") {
              setSelectedDate(getTaiwanTime())
            }
          }}
        />
      </div>

      <div>
        <FloatingActionButton
          onAddCourse={() => {
            handleTabChange("courses")
            setShowCourseForm(true)
          }}
          onAddAssignment={() => {
            handleTabChange("tasks")
            setTaskType("assignment")
            setShowAssignmentForm(true)
          }}
          onAddNote={() => {
            handleTabChange("notes")
            setShowNoteForm(true)
          }}
          onAddExam={() => {
            handleTabChange("tasks")
            setTaskType("exam")
            setShowExamForm(true)
          }}

        />
      </div>


    </div>
  )
}