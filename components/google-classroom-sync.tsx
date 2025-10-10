"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { GoogleIcon, RefreshIcon, CheckIcon, AlertTriangleIcon, SettingsIcon } from "@/components/icons"
import { useCourses } from "@/hooks/use-courses"
import { ApiService } from "@/services/apiService"
import { GoogleAuthManager } from "@/components/google-auth-manager"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface GoogleClassroomSyncProps {
  onSync?: () => void
  selectedCourseIds?: string[]
}

interface SyncStatus {
  is_connected: boolean
  last_sync: string | null
  sync_count: number
  error_message?: string
}

export function GoogleClassroomSync({ onSync, selectedCourseIds }: GoogleClassroomSyncProps) {
  const lineUserId = ApiService.bootstrapLineUserId()
  const { assignments, courses, refetch } = useCourses(lineUserId)
  const [isLoading, setIsLoading] = useState(false)
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null)
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const googleClassroomCourses = courses.filter((course) => course.source === "google_classroom")
  const existingGoogleAssignments = assignments.filter((assignment) => assignment.source === "google_classroom")

  // 檢查 Google API 連接狀態
  useEffect(() => {
    const checkConnectionStatus = async () => {
      try {
        const response = await ApiService.getGoogleApiStatus()
        if (response.data) {
          setIsConnected((response.data as any).is_connected || false)
          if ((response.data as any).error_message) {
            setErrorMessage((response.data as any).error_message)
          }
        }
      } catch (error) {
        console.error('檢查 Google API 狀態失敗:', error)
        setIsConnected(false)
        setErrorMessage('無法檢查 Google Classroom 連接狀態')
      }
    }

    const getSyncStatus = async () => {
      try {
        const response = await ApiService.getGoogleSyncStatus()
        if (response.data) {
          setSyncStatus(response.data as SyncStatus)
          if ((response.data as any).last_sync) {
            setLastSyncTime(new Date((response.data as any).last_sync))
          }
        }
      } catch (error) {
        console.error('獲取同步狀態失敗:', error)
      }
    }

    checkConnectionStatus()
    getSyncStatus()
  }, [])

  const handleSync = async () => {
    setIsLoading(true)
    setErrorMessage(null)

    try {
      // 檢查 Google API 連接狀態
      const statusResponse = await ApiService.getGoogleApiStatus()
      if (!statusResponse.data?.is_connected) {
        setErrorMessage('Google API 未連接，請先進行授權')
        setIsLoading(false)
        return
      }

      // 執行同步 - 如果有選中的課程，則只同步選中的課程；否則同步所有課程
      let response
      if (selectedCourseIds && selectedCourseIds.length > 0) {
        response = await ApiService.syncAssignments(selectedCourseIds)
      } else {
        response = await ApiService.syncGoogleClassroom()
      }
      
      if (response.error) {
        if (response.error.includes('NOT_AUTHORIZED') || response.error.includes('授權')) {
          setErrorMessage('Google Classroom 授權已過期，請重新授權')
          setIsConnected(false)
        } else {
          setErrorMessage(response.error)
        }
      } else {
        // 同步成功，重新獲取數據
        await refetch()
        setLastSyncTime(new Date())
        setErrorMessage(null)
        
        // 更新同步狀態
        const statusResponse = await ApiService.getGoogleSyncStatus()
        if (statusResponse.data) {
          setSyncStatus(statusResponse.data as SyncStatus)
        }
      }
    } catch (error) {
      console.error('Google Classroom 同步失敗:', error)
      setErrorMessage('同步失敗，請稍後再試')
    } finally {
      setIsLoading(false)
      onSync?.()
    }
  }



  return (
    <Card className="p-4 sm:p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <GoogleIcon className="w-6 h-6 text-blue-600" />
            <div>
              <h3 className="text-lg font-semibold">Google Classroom 同步</h3>
              <p className="text-sm text-muted-foreground">
                同步 Google Classroom 中的最新作業和課程
              </p>
              {!isConnected && (
                <p className="text-sm text-red-600 mt-1">
                  ⚠️ Google Classroom 未連接
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={handleSync} 
              disabled={isLoading || !isConnected} 
              className="gap-2"
            >
              <RefreshIcon className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
              {isLoading ? "同步中..." : "立即同步"}
            </Button>
          </div>
        </div>

        {/* 授權管理 */}
        {!isConnected && errorMessage?.includes('授權') && (
          <GoogleAuthManager 
            showClassroomSync={true}
            showCalendarSync={false}
            onAuthSuccess={() => {
              setErrorMessage(null)
              setIsConnected(true)
              // 重新載入數據
              setTimeout(() => {
                window.location.reload()
              }, 1000)
            }}
            onAuthError={(error) => {
              setErrorMessage(`授權失敗：${error}`)
            }}
          />
        )}

        {/* 錯誤訊息 */}
        {errorMessage && !errorMessage.includes('授權') && (
          <Alert variant="destructive">
            <AlertTriangleIcon className="h-4 w-4" />
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        {/* Sync Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
          <div className={`flex items-center gap-3 p-3 rounded-lg ${
            isConnected 
              ? 'bg-blue-50 dark:bg-blue-900/20' 
              : 'bg-gray-50 dark:bg-gray-900/20'
          }`}>
            <GoogleIcon className={`w-5 h-5 ${
              isConnected ? 'text-blue-600' : 'text-gray-400'
            }`} />
            <div>
              <div className={`font-medium ${
                isConnected 
                  ? 'text-blue-900 dark:text-blue-100' 
                  : 'text-gray-600 dark:text-gray-400'
              }`}>
                {googleClassroomCourses.length} 個課程
              </div>
              <div className={`text-xs ${
                isConnected 
                  ? 'text-blue-700 dark:text-blue-300' 
                  : 'text-gray-500 dark:text-gray-500'
              }`}>
                {isConnected ? '已連接 Google Classroom' : '未連接 Google Classroom'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
            <CheckIcon className="w-5 h-5 text-green-600" />
            <div>
              <div className="font-medium text-green-900 dark:text-green-100">
                {existingGoogleAssignments.length} 個作業
              </div>
              <div className="text-xs text-green-700 dark:text-green-300">已同步至系統</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20">
            <RefreshIcon className="w-5 h-5 text-purple-600" />
            <div>
              <div className="font-medium text-purple-900 dark:text-purple-100">
                {syncStatus?.sync_count || 0} 次同步
              </div>
              <div className="text-xs text-purple-700 dark:text-purple-300">
                {lastSyncTime ? '最近同步成功' : '尚未同步'}
              </div>
            </div>
          </div>
        </div>

        {/* Last Sync Time */}
        {lastSyncTime && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckIcon className="w-4 h-4 text-green-600" />
            上次同步時間：{lastSyncTime.toLocaleString("zh-TW")}
          </div>
        )}

        {/* Connected Courses */}
        <div className="space-y-3">
          <h4 className="font-medium">已連接的 Google Classroom 課程</h4>
          <div className="grid gap-2">
            {googleClassroomCourses.map((course) => (
              <div key={course.id} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: course.color }} />
                  <div>
                    <div className="font-medium">{course.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {course.courseCode} • {course.instructor}
                    </div>
                  </div>
                </div>

                <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-300">
                  {existingGoogleAssignments.filter((a) => a.courseId === course.id).length} 個作業
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Sync Instructions */}
        <div className="p-4 rounded-lg bg-muted/50">
          <h4 className="font-medium mb-2">同步說明</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• 首次使用需要先連接 Google Classroom 帳戶</li>
            <li>• 系統會同步您的課程、作業和考試資訊</li>
            <li>• 已同步的資料會保持與 Google Classroom 的連結</li>
            <li>• 可以透過 LINE Bot 自然語言查詢同步的資料</li>
            <li>• 建議定期同步以獲取最新的資訊</li>
          </ul>
          
          {!isConnected && (
            <div className="mt-3 p-3 rounded-lg bg-yellow-50 border border-yellow-200">
              <p className="text-sm text-yellow-800">
                💡 <strong>提示：</strong>請先在後端系統中設定 Google Classroom API 憑證，
                然後點擊「測試連接」按鈕檢查連接狀態。
              </p>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}
