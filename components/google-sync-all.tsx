"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { RefreshIcon, CheckIcon, AlertTriangleIcon } from "@/components/icons"
import { ApiService } from "@/services/apiService"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface GoogleSyncAllProps {
  onSync?: () => void
  selectedCourseIds?: string[]
}

interface SyncResult {
  success: boolean
  message: string
  data?: {
    sync_results: {
      classroom: {
        success: boolean
        courses_synced?: number
        assignments_synced?: number
        errors?: string[]
        error?: string
      }
      calendar: {
        success: boolean
        events_synced?: number
        errors?: string[]
        error?: string
      }
    }
    sync_time: string
    sync_type: string
  }
}

interface CourseSchedule {
  day_of_week: number
  start_time: string
  end_time: string
  location?: string
}

interface ClassroomCourse {
  id: string
  name: string
  section?: string
  description?: string
  room?: string
  ownerId?: string
  creationTime?: string
  updateTime?: string
  enrollmentCode?: string
  courseState?: string
  alternateLink?: string
  teacherFolder?: any
  guardiansEnabled?: boolean
  calendarId?: string
}

interface PreviewData {
  classroom_courses?: ClassroomCourse[]
  existing_course_ids?: string[]
  assignments?: any[]
}

export function GoogleSyncAll({ onSync, selectedCourseIds }: GoogleSyncAllProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [lastSyncResult, setLastSyncResult] = useState<SyncResult | null>(null)
  const [showPreviewDialog, setShowPreviewDialog] = useState(false)
  const [previewData, setPreviewData] = useState<PreviewData | null>(null)
  const [courseSchedules, setCourseSchedules] = useState<Record<string, CourseSchedule[]>>({})

  const handleSync = async () => {
    setIsLoading(true)
    setLastSyncResult(null)

    try {
      // 步驟 1: 呼叫 preview-sync-all 預覽同步內容（只返回課程）
      const response = await ApiService.previewSyncAll()
      
      if (response.error) {
        setLastSyncResult({
          success: false,
          message: response.error,
        })
        return
      }
      
      // 顯示預覽對話框
      const data = response.data?.data || response.data || {}
      const previewData = data.preview_data || data
      
      // 確保課程數據格式正確
      const formattedPreviewData = {
        classroom_courses: previewData?.courses || previewData?.classroom_courses || [],
        existing_course_ids: previewData?.existing_course_ids || []
      }
      
      setPreviewData(formattedPreviewData)
      setShowPreviewDialog(true)
      
    } catch (error) {
      setLastSyncResult({
        success: false,
        message: error instanceof Error ? error.message : '同步失敗',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleFullSync = async () => {
    setIsLoading(true)
    setLastSyncResult(null)

    try {
      // 僅同步選中的課程之作業；若未選擇，回退為「已匯入的 Google 課程」
      let courseIds = selectedCourseIds || []
      if (!courseIds.length) {
        try {
          const previewResp = await ApiService.previewSyncAll()
          const previewData = previewResp?.data?.data?.preview_data || previewResp?.data?.preview_data || previewResp?.data || {}
          const existingIds = previewData?.existing_data?.courses || []
          courseIds = Array.isArray(existingIds) ? existingIds : []
        } catch (e) {
          // 若回退取得失敗，維持空陣列以提示錯誤
          courseIds = []
        }
      }
      if (!courseIds.length) {
        setLastSyncResult({
          success: false,
          message: '尚未選擇課程，且沒有已匯入的 Google 課程可同步',
        })
        return
      }
      const response = await ApiService.manualSyncAll(courseIds)
      
      if (response.error) {
        setLastSyncResult({
          success: false,
          message: response.error,
        })
        return
      }

      const data = response.data?.data || response.data || {}
      const syncResults = data.sync_results || {}

      setLastSyncResult({
        success: response.data?.success !== false,
        message: response.data?.message || '已同步課程的作業與行事曆',
        data: {
          sync_results: syncResults,
          sync_time: data.sync_time || new Date().toISOString(),
          sync_type: 'assignments_plus_calendar'
        }
      })
      
      // 呼叫回調函數以重新載入資料
      if (onSync) {
        onSync()
      }
    } catch (error) {
      setLastSyncResult({
        success: false,
        message: error instanceof Error ? error.message : '同步失敗',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleConfirmImport = async () => {
    setIsLoading(true)
    setShowPreviewDialog(false)

    try {
      // 收集所有要匯入的課程 ID
      const selectedCourseIds = previewData?.classroom_courses?.map(c => c.id) || []
      
      // 步驟 2: 呼叫 confirm-import 確認匯入，包含課程時間
      const response = await ApiService.confirmImport({
        courses: selectedCourseIds,
        schedules: courseSchedules
      })
      
      if (response.error) {
        setLastSyncResult({
          success: false,
          message: response.error,
        })
        return
      }
      
      const result = response.data?.data || response.data
      const importResults = result?.import_results?.classroom
      
      setLastSyncResult({
        success: true,
        message: response.data?.message || `成功匯入 ${importResults?.courses_imported || 0} 個課程`,
        data: {
          sync_results: {
            classroom: {
              success: importResults?.success || true,
              courses_synced: importResults?.courses_imported || 0,
              assignments_synced: importResults?.assignments_imported || 0,
              errors: importResults?.errors || []
            },
            calendar: {
              success: true,
              events_synced: 0,
              errors: []
            }
          },
          sync_time: result?.import_time || new Date().toISOString(),
          sync_type: result?.import_type || 'selective'
        }
      })
      
      // 呼叫回調函數以重新載入資料
      if (onSync) {
        onSync()
      }
    } catch (error) {
      setLastSyncResult({
        success: false,
        message: error instanceof Error ? error.message : '匯入失敗',
      })
    } finally {
      setIsLoading(false)
      setPreviewData(null)
      setCourseSchedules({})
    }
  }

  const addScheduleForCourse = (courseId: string) => {
    setCourseSchedules(prev => ({
      ...prev,
      [courseId]: [
        ...(prev[courseId] || []),
        {
          day_of_week: 1,
          start_time: '09:00',
          end_time: '10:00',
          location: ''
        }
      ]
    }))
  }

  const updateScheduleForCourse = (courseId: string, index: number, field: keyof CourseSchedule, value: any) => {
    setCourseSchedules(prev => ({
      ...prev,
      [courseId]: (prev[courseId] || []).map((schedule, idx) => 
        idx === index ? { ...schedule, [field]: value } : schedule
      )
    }))
  }

  const removeScheduleForCourse = (courseId: string, index: number) => {
    setCourseSchedules(prev => ({
      ...prev,
      [courseId]: (prev[courseId] || []).filter((_, idx) => idx !== index)
    }))
  }

  const weekDays = [
    { value: 1, label: '週一' },
    { value: 2, label: '週二' },
    { value: 3, label: '週三' },
    { value: 4, label: '週四' },
    { value: 5, label: '週五' },
    { value: 6, label: '週六' },
    { value: 0, label: '週日' },
  ]

  const renderSyncStatus = () => {
    if (!lastSyncResult) return null

    const { success, message, data } = lastSyncResult
    const classroomResult = data?.sync_results?.classroom
    const calendarResult = data?.sync_results?.calendar

    return (
      <div className="space-y-3">
        <Alert className={success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
          <div className="flex items-center gap-2">
            {success ? (
              <CheckIcon className="w-4 h-4 text-green-600" />
            ) : (
              <AlertTriangleIcon className="w-4 h-4 text-red-600" />
            )}
            <AlertDescription className={success ? "text-green-800" : "text-red-800"}>
              {message}
            </AlertDescription>
          </div>
        </Alert>

        {data && (
          <div className="space-y-2 text-sm">
            {/* Google Classroom 結果 */}
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span className="font-medium">Google Classroom</span>
              <div className="flex items-center gap-2">
                {classroomResult?.success ? (
                  <CheckIcon className="w-4 h-4 text-green-600" />
                ) : (
                  <AlertTriangleIcon className="w-4 h-4 text-red-600" />
                )}
                <span className="text-xs text-muted-foreground">
                  {classroomResult?.success 
                    ? `${classroomResult.courses_synced || 0} 課程, ${classroomResult.assignments_synced || 0} 作業`
                    : classroomResult?.error || '同步失敗'
                  }
                </span>
              </div>
            </div>

            {/* Google Calendar 結果 */}
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span className="font-medium">Google Calendar</span>
              <div className="flex items-center gap-2">
                {calendarResult?.success ? (
                  <CheckIcon className="w-4 h-4 text-green-600" />
                ) : (
                  <AlertTriangleIcon className="w-4 h-4 text-red-600" />
                )}
                <span className="text-xs text-muted-foreground">
                  {calendarResult?.success 
                    ? `${calendarResult.events_synced || 0} 事件`
                    : calendarResult?.error || '同步失敗'
                  }
                </span>
              </div>
            </div>

            <div className="text-xs text-muted-foreground">
              同步時間: {new Date(data.sync_time).toLocaleString('zh-TW')}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-2">
          <Button 
            onClick={handleFullSync} 
            disabled={isLoading}
            className="w-full"
            variant="default"
          >
            <RefreshIcon className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? '同步中...' : '同步匯入課程的作業與行事曆'}
          </Button>
        </div>

        {renderSyncStatus()}
      </div>

      {/* 預覽對話框 */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>確認同步內容</DialogTitle>
            <DialogDescription>
              以下是從 Google Classroom 獲取的課程和作業，請確認後匯入
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* 課程列表與時間設定 */}
            {previewData?.classroom_courses && previewData.classroom_courses.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">課程 ({previewData.classroom_courses.length})</h3>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {previewData.classroom_courses.map((course) => {
                    const isExisting = previewData.existing_course_ids?.includes(course.id)
                    return (<div key={course.id} className={`p-4 rounded-lg space-y-3 ${isExisting ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-50'}`}>
                      <div>
                        <div className="flex items-center gap-2">
                          <div className="font-medium">{course.name}</div>
                          {isExisting && (
                            <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded">已存在</span>
                          )}
                        </div>
                        {course.section && (
                          <div className="text-sm text-muted-foreground">{course.section}</div>
                        )}
                        {course.room && (
                          <div className="text-sm text-muted-foreground">教室: {course.room}</div>
                        )}
                      </div>

                      {/* 課程時間設定 */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">上課時間</span>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => addScheduleForCourse(course.id)}
                          >
                            + 新增時段
                          </Button>
                        </div>

                        {courseSchedules[course.id]?.map((schedule, idx) => (
                          <div key={idx} className="grid grid-cols-12 gap-2 items-center p-2 bg-white rounded border">
                            <select
                              className="col-span-3 text-sm border rounded px-2 py-1"
                              value={schedule.day_of_week}
                              onChange={(e) => updateScheduleForCourse(course.id, idx, 'day_of_week', parseInt(e.target.value))}
                            >
                              {weekDays.map(day => (
                                <option key={day.value} value={day.value}>{day.label}</option>
                              ))}
                            </select>
                            <input
                              type="time"
                              className="col-span-3 text-sm border rounded px-2 py-1"
                              value={schedule.start_time}
                              onChange={(e) => updateScheduleForCourse(course.id, idx, 'start_time', e.target.value)}
                            />
                            <input
                              type="time"
                              className="col-span-3 text-sm border rounded px-2 py-1"
                              value={schedule.end_time}
                              onChange={(e) => updateScheduleForCourse(course.id, idx, 'end_time', e.target.value)}
                            />
                            <input
                              type="text"
                              placeholder="地點"
                              className="col-span-2 text-sm border rounded px-2 py-1"
                              value={schedule.location || ''}
                              onChange={(e) => updateScheduleForCourse(course.id, idx, 'location', e.target.value)}
                            />
                            <button
                              type="button"
                              className="col-span-1 text-red-500 hover:text-red-700"
                              onClick={() => removeScheduleForCourse(course.id, idx)}
                            >
                              ✕
                            </button>
                          </div>
                        ))}

                        {(!courseSchedules[course.id] || courseSchedules[course.id].length === 0) && (
                          <div className="text-sm text-muted-foreground text-center py-2">
                            尚未設定上課時間
                          </div>
                        )}
                      </div>
                    </div>
                  )
                  })}
                </div>
              </div>
            )}

            {/* 提示訊息 */}
            {previewData?.existing_course_ids && previewData.existing_course_ids.length > 0 && (
              <Alert className="border-blue-200 bg-blue-50">
                <AlertDescription className="text-blue-800 text-sm">
                  已存在的課程將會被更新，不會重複創建
                </AlertDescription>
              </Alert>
            )}

            {/* 作業列表 - API 只返回課程，不返回作業 */}
            {false && previewData?.assignments && (
              <div>
                <h3 className="font-semibold mb-2">作業 ({previewData?.assignments?.length || 0})</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {previewData?.assignments?.map((assignment: any) => (
                    <div key={assignment.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="font-medium">{assignment.title}</div>
                      {assignment.course_name && (
                        <div className="text-sm text-muted-foreground">{assignment.course_name}</div>
                      )}
                      {assignment.due_date && (
                        <div className="text-sm text-muted-foreground">
                          截止: {new Date(assignment.due_date).toLocaleString('zh-TW')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 空狀態 */}
            {(!previewData?.classroom_courses || previewData.classroom_courses.length === 0) && (
              <div className="text-center py-8 text-muted-foreground">
                沒有可同步的內容
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowPreviewDialog(false)
                setPreviewData(null)
              }}
              disabled={isLoading}
            >
              取消
            </Button>
            <Button
              onClick={handleConfirmImport}
              disabled={isLoading || !previewData?.classroom_courses?.length}
            >
              {isLoading ? '匯入中...' : '確認匯入課程'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}