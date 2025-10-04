"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { RefreshIcon, CheckIcon, AlertTriangleIcon } from "@/components/icons"
import { ApiService } from "@/services/apiService"

interface GoogleSyncAllProps {
  onSync?: () => void
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

export function GoogleSyncAll({ onSync }: GoogleSyncAllProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [lastSyncResult, setLastSyncResult] = useState<SyncResult | null>(null)

  const handleSync = async () => {
    setIsLoading(true)
    setLastSyncResult(null)

    try {
      const response = await ApiService.manualSyncAll()
      
      if (response.error) {
        setLastSyncResult({
          success: false,
          message: response.error,
        })
      } else {
        setLastSyncResult({
          success: response.data?.success || false,
          message: response.data?.message || '同步完成',
          data: response.data
        })
        
        // 呼叫回調函數以重新載入資料
        if (onSync) {
          onSync()
        }
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
    <div className="space-y-4">
      <Button 
        onClick={handleSync} 
        disabled={isLoading}
        className="w-full"
        variant="outline"
      >
        <RefreshIcon className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
        {isLoading ? '同步中...' : '立即同步所有 Google 服務'}
      </Button>

      {renderSyncStatus()}
    </div>
  )
}