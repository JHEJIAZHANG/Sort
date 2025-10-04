"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { GoogleIcon, RefreshIcon, CheckIcon, AlertTriangleIcon, SettingsIcon, CalendarIcon } from "@/components/icons"
import { ApiService } from "@/services/apiService"
import { GoogleAuthManager } from "@/components/google-auth-manager"

interface GoogleCalendarSyncProps {
  onSync?: () => void
}

interface CalendarEvent {
  id: string
  summary: string
  description?: string
  start: {
    dateTime?: string
    date?: string
  }
  end: {
    dateTime?: string
    date?: string
  }
  location?: string
  attendees?: Array<{ email: string; displayName?: string }>
}

interface SyncStatus {
  is_connected: boolean
  last_sync: string | null
  sync_count: number
  error_message?: string
}

export function GoogleCalendarSync({ onSync }: GoogleCalendarSyncProps) {
  const lineUserId = ApiService.bootstrapLineUserId()
  const [isLoading, setIsLoading] = useState(false)
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null)
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([])

  // 檢查 Google API 連接狀態
  useEffect(() => {
    const checkConnectionStatus = async () => {
      try {
        const response = await ApiService.getGoogleApiStatus()
        if (response.data) {
          setIsConnected((response.data as any).is_connected || false)
        }
      } catch (error) {
        console.error('檢查連接狀態失敗:', error)
        setIsConnected(false)
        setErrorMessage('無法檢查 Google Calendar 連接狀態')
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
        setErrorMessage('無法獲取同步狀態')
      }
    }

    const loadCalendarEvents = async () => {
      try {
        const now = new Date()
        const oneMonthLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
        
        const response = await ApiService.getCalendarEvents({
          time_min: now.toISOString(),
          time_max: oneMonthLater.toISOString(),
          max_results: 10
        })
        
        if (response.error) {
          if (response.error.includes('NOT_AUTHORIZED') || response.error.includes('授權')) {
            setErrorMessage('Google Calendar 授權已過期，請重新授權')
            setIsConnected(false)
          } else {
            setErrorMessage(`載入日曆事件失敗：${response.error}`)
          }
        } else if ((response as any).code === 'NOT_AUTHORIZED') {
          // 處理後端返回的 NOT_AUTHORIZED 狀態碼
          setErrorMessage('Google Calendar 尚未授權，請先進行授權')
          setIsConnected(false)
          setCalendarEvents([])
        } else if (response.data && Array.isArray(response.data)) {
          setCalendarEvents(response.data as CalendarEvent[])
          setErrorMessage(null)
                }

      } catch (error) {
        console.error('載入日曆事件失敗:', error)
        setErrorMessage('載入日曆事件時發生錯誤')
      }
    }

    checkConnectionStatus()
    getSyncStatus()
    if (isConnected) {
      loadCalendarEvents()
    }
  }, [isConnected])

  const handleTestConnection = async () => {
    setIsLoading(true)
    setErrorMessage(null)

    try {
      const response = await ApiService.getGoogleApiStatus()
      if (response.error) {
        setErrorMessage(response.error)
        setIsConnected(false)
      } else if (response.data) {
        setIsConnected((response.data as any).is_connected || false)
        setErrorMessage(null)
      } else {
        setIsConnected(false)
        setErrorMessage('無法取得連接狀態')
      }
    } catch (error) {
      console.error('測試連接失敗:', error)
      setErrorMessage('連接測試失敗，請檢查授權狀態')
      setIsConnected(false)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSync = async () => {
    setIsLoading(true)
    setErrorMessage(null)

    try {
      // 重新載入日曆事件
      const now = new Date()
      const oneMonthLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
      
      const response = await ApiService.getCalendarEvents({
        time_min: now.toISOString(),
        time_max: oneMonthLater.toISOString(),
        max_results: 10
      })
      
      if (response.error) {
        setErrorMessage(response.error)
      } else {
        if (response.data && Array.isArray(response.data)) {
          setCalendarEvents(response.data as CalendarEvent[])
        }
        setLastSyncTime(new Date())
        
        // 更新同步狀態
        const statusResponse = await ApiService.getGoogleSyncStatus()
        if (statusResponse.data) {
          setSyncStatus(statusResponse.data as SyncStatus)
        }
      }
    } catch (error) {
      console.error('Google Calendar 同步失敗:', error)
      setErrorMessage('同步失敗，請稍後再試')
    } finally {
      setIsLoading(false)
      onSync?.()
    }
  }

  const formatEventTime = (event: CalendarEvent) => {
    const start = event.start.dateTime || event.start.date
    const end = event.end.dateTime || event.end.date
    
    if (!start) return ''
    
    const startDate = new Date(start)
    const endDate = end ? new Date(end) : null
    
    if (event.start.date) {
      // 全天事件
      return startDate.toLocaleDateString('zh-TW')
    } else {
      // 有時間的事件
      const timeStr = startDate.toLocaleString('zh-TW', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
      
      if (endDate && endDate.getTime() !== startDate.getTime()) {
        const endTimeStr = endDate.toLocaleTimeString('zh-TW', {
          hour: '2-digit',
          minute: '2-digit'
        })
        return `${timeStr} - ${endTimeStr}`
      }
      
      return timeStr
    }
  }

  return (
    <Card className="p-4 sm:p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CalendarIcon className="w-6 h-6 text-green-600" />
            <div>
              <h3 className="text-lg font-semibold">Google Calendar 同步</h3>
              <p className="text-sm text-muted-foreground">
                同步 Google Calendar 中的最新事件和行程
              </p>
              {!isConnected && (
                <p className="text-sm text-red-600 mt-1">
                  ⚠️ Google Calendar 未連接
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={handleTestConnection} 
              variant="outline" 
              size="sm"
              className="gap-2"
            >
              <SettingsIcon className="w-4 h-4" />
              測試連接
            </Button>
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
            showClassroomSync={false}
            showCalendarSync={true}
            onAuthSuccess={() => {
              setErrorMessage(null)
              setIsConnected(true)
              // 重新載入事件
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
              ? 'bg-green-50 dark:bg-green-900/20' 
              : 'bg-gray-50 dark:bg-gray-900/20'
          }`}>
            <CalendarIcon className={`w-5 h-5 ${
              isConnected ? 'text-green-600' : 'text-gray-400'
            }`} />
            <div>
              <div className={`font-medium ${
                isConnected 
                  ? 'text-green-900 dark:text-green-100' 
                  : 'text-gray-600 dark:text-gray-400'
              }`}>
                {calendarEvents.length} 個事件
              </div>
              <div className={`text-xs ${
                isConnected 
                  ? 'text-green-700 dark:text-green-300' 
                  : 'text-gray-500 dark:text-gray-500'
              }`}>
                {isConnected ? '已連接 Google Calendar' : '未連接 Google Calendar'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
            <CheckIcon className="w-5 h-5 text-blue-600" />
            <div>
              <div className="font-medium text-blue-900 dark:text-blue-100">
                近期事件
              </div>
              <div className="text-xs text-blue-700 dark:text-blue-300">已載入至系統</div>
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

        {/* Calendar Events */}
        <div className="space-y-3">
          <h4 className="font-medium">近期 Google Calendar 事件</h4>
          <div className="grid gap-2">
            {calendarEvents.length > 0 ? (
              calendarEvents.map((event) => (
                <div key={event.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <div>
                      <div className="font-medium">{event.summary}</div>
                      <div className="text-sm text-muted-foreground">
                        {formatEventTime(event)}
                        {event.location && ` • ${event.location}`}
                      </div>
                    </div>
                  </div>

                  {event.attendees && event.attendees.length > 0 && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-300">
                      {event.attendees.length} 位參與者
                    </Badge>
                  )}
                </div>
              ))
            ) : (
              <div className="text-sm text-muted-foreground text-center py-4">
                {isConnected ? '近期無事件' : '請先連接 Google Calendar'}
              </div>
            )}
          </div>
        </div>

        {/* Sync Instructions */}
        <div className="p-4 rounded-lg bg-muted/50">
          <h4 className="font-medium mb-2">同步說明</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• 首次使用需要先連接 Google Calendar 帳戶</li>
            <li>• 系統會同步您的日曆事件和行程資訊</li>
            <li>• 已同步的資料會保持與 Google Calendar 的連結</li>
            <li>• 可以透過 LINE Bot 自然語言查詢同步的資料</li>
            <li>• 建議定期同步以獲取最新的資訊</li>
          </ul>
          
          {!isConnected && (
            <div className="mt-3 p-3 rounded-lg bg-yellow-50 border border-yellow-200">
              <p className="text-sm text-yellow-800">
                💡 <strong>提示：</strong>請先在後端系統中設定 Google Calendar API 憑證，
                然後點擊「測試連接」按鈕檢查連接狀態。
              </p>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}